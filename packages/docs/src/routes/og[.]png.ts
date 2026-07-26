import "@tanstack/react-start/server-only";
import { Resvg } from "@resvg/resvg-js";
import { createFileRoute } from "@tanstack/react-router";

import geistFontDataUrl from "../assets/Geist-Variable.ttf?inline";
import { getDocByPath } from "../lib/docs";

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const geistFontBuffer = Uint8Array.from(
	Buffer.from(
		geistFontDataUrl.slice(geistFontDataUrl.indexOf(",") + 1),
		"base64",
	),
);
const fontOptions = {
	defaultFontFamily: "Geist",
	fontBuffers: [geistFontBuffer],
	loadSystemFonts: false,
};

const escapeXml = (value: string) =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");

const wrapText = (value: string, maxCharacters: number, maxLines: number) => {
	const words = value.trim().split(/\s+/);
	const lines: string[] = [];
	let line = "";

	for (const word of words) {
		const nextLine = line ? `${line} ${word}` : word;

		if (nextLine.length <= maxCharacters) {
			line = nextLine;
			continue;
		}

		if (line) {
			lines.push(line);
		}

		line = word;

		if (lines.length === maxLines) {
			break;
		}
	}

	if (line && lines.length < maxLines) {
		lines.push(line);
	}

	const consumed = lines.join(" ").split(/\s+/).filter(Boolean).length;

	if (consumed < words.length && lines.length > 0) {
		lines[lines.length - 1] =
			`${lines[lines.length - 1].replace(/[.,;:]*$/, "")}…`;
	}

	return lines;
};

const renderLines = ({
	lines,
	x,
	y,
	lineHeight,
	className,
}: {
	lines: string[];
	x: number;
	y: number;
	lineHeight: number;
	className: string;
}) =>
	lines
		.map(
			(line, index) =>
				`<text class="${className}" x="${x}" y="${y + index * lineHeight}">${escapeXml(line)}</text>`,
		)
		.join("\n");

const createSocialImage = ({ title }: { title: string }) => {
	const titleLines = wrapText(title, title.length > 48 ? 23 : 28, 3);
	const titleY = 321 - ((titleLines.length - 1) * 80) / 2;
	const categoryY = titleY + (titleLines.length - 1) * 80 + 42;

	return `<svg width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" viewBox="0 0 ${IMAGE_WIDTH} ${IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" rx="18" fill="#000000"/>
  <g transform="translate(64 60)">
    <rect x="8" y="2" width="23" height="42" rx="9" fill="#3730a3"/>
    <rect x="24" y="0" width="26" height="46" rx="10" fill="#6366f1"/>
  </g>
  ${renderLines({ className: "title", lines: titleLines, x: 64, y: titleY, lineHeight: 80 })}
  <text class="category" x="64" y="${categoryY}">Screen Transitions / Documentation</text>
  <style>
    text { font-family: Geist, sans-serif; font-kerning: normal; }
    .title { fill: #ffffff; font-size: 76px; font-weight: 600; letter-spacing: -2.8px; }
    .category { fill: #8b8b8f; font-size: 21px; font-weight: 500; letter-spacing: .4px; }
  </style>
</svg>`;
};

export const Route = createFileRoute("/og.png")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const path = new URL(request.url).searchParams.get("path") ?? "/";
				const doc = getDocByPath(path);

				if (!doc) {
					return new Response("Unknown documentation page", { status: 404 });
				}

				const title = doc.to === "/" ? "Screen Transitions" : doc.pageTitle;
				const png = new Resvg(createSocialImage({ title }), {
					fitTo: { mode: "width", value: IMAGE_WIDTH },
					font: fontOptions,
				})
					.render()
					.asPng();

				return new Response(Uint8Array.from(png), {
					headers: {
						"Cache-Control":
							"public, s-maxage=86400, stale-while-revalidate=604800",
						"Content-Type": "image/png",
					},
				});
			},
		},
	},
});
