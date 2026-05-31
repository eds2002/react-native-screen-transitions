import { Resvg } from "@resvg/resvg-js";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, "..");
const contentRoot = path.join(docsRoot, "src/content/docs");
const publicOgRoot = path.join(docsRoot, "public/og");
const distRoot = path.join(docsRoot, "dist");
const distOgRoot = path.join(distRoot, "og");
const geistPackageRoot = path.resolve(
	path.dirname(require.resolve("geist/font/sans-non-variable")),
	"..",
);
const geistRegularFontPath = path.join(
	geistPackageRoot,
	"dist/fonts/geist-sans/Geist-Regular.ttf",
);
const geistBoldFontPath = path.join(
	geistPackageRoot,
	"dist/fonts/geist-sans/Geist-Bold.ttf",
);

const siteName = "Screen Transitions";
const rootDescription =
	"Build custom screen transitions, snap sheets, overlays, and bounds-driven navigation motion with the v3 API.";

function escapeHtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

function parseFrontmatter(source) {
	const match = /^---\n([\s\S]*?)\n---/.exec(source);

	if (!match) {
		return {};
	}

	return Object.fromEntries(
		match[1]
			.split("\n")
			.map((line) => {
				const field = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);

				if (!field) {
					return null;
				}

				const [, key, rawValue] = field;
				const value = rawValue.trim();

				if (value === "true") {
					return [key, true];
				}

				if (value === "false") {
					return [key, false];
				}

				return [key, value.replace(/^["']|["']$/g, "")];
			})
			.filter(Boolean),
	);
}

async function listMdxFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const entryPath = path.join(directory, entry.name);

			if (entry.isDirectory()) {
				return listMdxFiles(entryPath);
			}

			return entry.name.endsWith(".mdx") ? [entryPath] : [];
		}),
	);

	return files.flat();
}

function normalizePathname(pathname) {
	if (pathname.length > 1 && pathname.endsWith("/")) {
		return pathname.slice(0, -1);
	}

	return pathname;
}

function resolveRoutePath(relativeFilePath, to) {
	if (relativeFilePath.startsWith("v4-next/")) {
		return to === "/" ? "/v4-next/" : `/v4-next${normalizePathname(to)}`;
	}

	return to === "/" ? "/" : normalizePathname(to);
}

function getSocialImageName(routePath) {
	if (routePath === "/") {
		return "index";
	}

	return normalizePathname(routePath).replace(/^\//, "").replaceAll("/", "-");
}

function getSocialImagePath(routePath) {
	return `/og/${getSocialImageName(routePath)}.png`;
}

function estimateTextWidth(text, fontSize) {
	return [...text].reduce((width, char) => {
		if (char === " ") {
			return width + fontSize * 0.28;
		}

		if (/[A-Z0-9]/.test(char)) {
			return width + fontSize * 0.61;
		}

		if (/[.,:;|()[\]{}"'`]/.test(char)) {
			return width + fontSize * 0.25;
		}

		return width + fontSize * 0.52;
	}, 0);
}

function wrapText(text, fontSize, maxWidth, maxLines) {
	const words = text.split(/\s+/).filter(Boolean);
	const lines = [];
	let currentLine = "";

	for (const word of words) {
		const nextLine = currentLine ? `${currentLine} ${word}` : word;

		if (estimateTextWidth(nextLine, fontSize) <= maxWidth) {
			currentLine = nextLine;
			continue;
		}

		if (currentLine) {
			lines.push(currentLine);
		}

		currentLine = word;

		if (lines.length === maxLines) {
			break;
		}
	}

	if (currentLine && lines.length < maxLines) {
		lines.push(currentLine);
	}

	const consumed = lines.join(" ").split(/\s+/).filter(Boolean).length;

	if (consumed < words.length && lines.length > 0) {
		lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:]*$/, "")}...`;
	}

	return lines;
}

function renderTextLines({ className, lines, startY, lineHeight, x }) {
	return lines
		.map(
			(line, index) =>
				`  <text class="${className}" x="${x}" y="${startY + index * lineHeight}">${escapeHtml(line)}</text>`,
		)
		.join("\n");
}

function createPreviewSvg({ description, title }) {
	const titleFontSize = title.length > 34 ? 62 : 72;
	const titleLines = wrapText(title, titleFontSize, 900, 2);
	const descriptionLines = wrapText(
		description,
		38,
		940,
		titleLines.length > 1 ? 3 : 4,
	);
	const descriptionStartY = 262 + (titleLines.length - 1) * 78;

	return `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="white"/>
  <style>
    text { font-family: "Geist Sans", sans-serif; font-kerning: normal; letter-spacing: 0; text-rendering: optimizeLegibility; }
    .title { fill: #09090B; font-size: ${titleFontSize}px; font-weight: 700; }
    .description { fill: #52525B; font-size: 38px; font-weight: 400; }
  </style>
${renderTextLines({ className: "title", lines: titleLines, startY: 190, lineHeight: 78, x: 96 })}
${renderTextLines({ className: "description", lines: descriptionLines, startY: descriptionStartY, lineHeight: 54, x: 96 })}
  <g transform="translate(1012 466) scale(2)">
    <rect x="15" y="8" width="22" height="40" rx="8" fill="#D4D4D4"/>
    <rect x="27" y="16" width="22" height="40" rx="8" fill="#525252"/>
  </g>
</svg>`;
}

async function collectDocs() {
	const files = await listMdxFiles(contentRoot);
	const docs = [];

	for (const file of files) {
		const source = await readFile(file, "utf8");
		const frontmatter = parseFrontmatter(source);

		if (!frontmatter.to || !frontmatter.pageTitle || !frontmatter.description) {
			continue;
		}

		const relativeFilePath = path
			.relative(contentRoot, file)
			.split(path.sep)
			.join("/");
		const routePath = resolveRoutePath(relativeFilePath, frontmatter.to);
		const title = routePath === "/" ? siteName : frontmatter.pageTitle;

		docs.push({
			description:
				routePath === "/" ? rootDescription : frontmatter.description,
			imagePath: getSocialImagePath(routePath),
			routePath,
			title,
		});
	}

	return docs.sort((left, right) => left.routePath.localeCompare(right.routePath));
}

async function writePreviewImages(docs) {
	await mkdir(publicOgRoot, { recursive: true });
	await mkdir(distOgRoot, { recursive: true });

	for (const doc of docs) {
		const svg = createPreviewSvg(doc);
		const renderer = new Resvg(svg, {
			background: "white",
			fitTo: {
				mode: "width",
				value: 1200,
			},
			font: {
				defaultFontFamily: "Geist Sans",
				fontFiles: [geistRegularFontPath, geistBoldFontPath],
				loadSystemFonts: false,
			},
		});
		const png = renderer.render().asPng();
		const imageName = `${getSocialImageName(doc.routePath)}.png`;

		await Promise.all([
			writeFile(path.join(publicOgRoot, imageName), png),
			writeFile(path.join(distOgRoot, imageName), png),
		]);
	}
}

function createMetaBlock(doc) {
	const metaTitle =
		doc.routePath === "/" ? siteName : `${doc.title} | ${siteName}`;

	return `		<meta
			name="description"
			content="${escapeHtml(doc.description)}"
		/>
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="${siteName}" />
		<meta property="og:title" content="${escapeHtml(metaTitle)}" />
		<meta
			property="og:description"
			content="${escapeHtml(doc.description)}"
		/>
		<meta property="og:image" content="${doc.imagePath}" />
		<meta property="og:image:alt" content="${escapeHtml(doc.title)} documentation preview" />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content="${escapeHtml(metaTitle)}" />
		<meta
			name="twitter:description"
			content="${escapeHtml(doc.description)}"
		/>
		<meta name="twitter:image" content="${doc.imagePath}" />
		<meta name="twitter:image:alt" content="${escapeHtml(doc.title)} documentation preview" />`;
}

function applyHead(html, doc) {
	const withTitle = html.replace(
		/<title>.*?<\/title>/,
		`<title>${escapeHtml(doc.routePath === "/" ? siteName : `${doc.title} | ${siteName}`)}</title>`,
	);

	return withTitle.replace(
		/\t\t<meta\s+name="description"[\s\S]*?\n\t\t<link rel="icon"/,
		`${createMetaBlock(doc)}\n\t\t<link rel="icon"`,
	);
}

function getOutputHtmlPath(routePath) {
	if (routePath === "/") {
		return path.join(distRoot, "index.html");
	}

	return path.join(distRoot, normalizePathname(routePath).replace(/^\//, ""), "index.html");
}

async function writeStaticRouteHtml(docs) {
	const template = await readFile(path.join(distRoot, "index.html"), "utf8");

	for (const doc of docs) {
		const outputPath = getOutputHtmlPath(doc.routePath);

		await mkdir(path.dirname(outputPath), { recursive: true });
		await writeFile(outputPath, applyHead(template, doc));
	}
}

async function writeRedirects(docs) {
	const routeRedirects = docs
		.filter((doc) => doc.routePath !== "/")
		.map((doc) => {
			const routePath = normalizePathname(doc.routePath);

			return `${routePath} ${routePath}/index.html 200`;
		});

	await writeFile(
		path.join(distRoot, "_redirects"),
		`${routeRedirects.join("\n")}\n/* /index.html 200\n`,
	);
}

const docs = await collectDocs();

await writePreviewImages(docs);
await writeStaticRouteHtml(docs);
await writeRedirects(docs);

console.log(`Generated ${docs.length} social preview images and route heads.`);
