import type { ComponentType } from "react";

export type DocSlug = string;
export type DocsVersion = "v3" | "v4";

type DocFrontmatter = {
	availability?: string;
	changelogDate?: string;
	description: string;
	eyebrow: string;
	group: string;
	hidden?: boolean;
	order: number;
	pageTitle: string;
	summary: string;
	title: string;
	to: string;
	version?: DocsVersion;
};

type DocModule = {
	default: ComponentType<Record<string, unknown>>;
	frontmatter?: Partial<DocFrontmatter>;
};

export type Doc = {
	availability?: string;
	changelogDate?: string;
	Content: ComponentType<Record<string, unknown>>;
	description: string;
	eyebrow: string;
	group: string;
	hidden: boolean;
	order: number;
	pageTitle: string;
	sourcePath: string;
	slug: DocSlug;
	summary: string;
	title: string;
	to: string;
	version: DocsVersion;
};

const siteUrl = new URL("https://screen-transitions.esjr.org");

const docModules = import.meta.glob<DocModule>("../content/docs/**/*.mdx", {
	eager: true,
});

const groupOrder = [
	"Get Started",
	"Integrations",
	"Adapters",
	"Core Concepts",
	"Navigation Transitions",
	"Components",
	"API",
	"Recipes",
	"Guides",
	"Changelogs",
];
const groupOrderIndex = new Map(
	groupOrder.map((group, index) => [group, index] as const),
);

function normalizePathname(pathname: string) {
	if (pathname.length > 1 && pathname.endsWith("/")) {
		return pathname.slice(0, -1);
	}

	return pathname;
}

function fallbackDocPath(slug: DocSlug) {
	return slug === "overview" ? "/" : `/${slug}`;
}

function resolveDocsVersion(value: unknown): DocsVersion {
	if (value === "v3" || value === "v4") {
		return value;
	}

	return "v4";
}

function resolveSlug(modulePath: string) {
	return modulePath
		.replace("../content/docs/", "")
		.replace(/\.mdx$/, "");
}

function compareDocs(left: Doc, right: Doc) {
	const groupDelta =
		(groupOrderIndex.get(left.group) ?? Number.MAX_SAFE_INTEGER) -
		(groupOrderIndex.get(right.group) ?? Number.MAX_SAFE_INTEGER);

	if (groupDelta !== 0) {
		return groupDelta;
	}

	if (left.order !== right.order) {
		return left.order - right.order;
	}

	return left.title.localeCompare(right.title);
}

function asString(value: unknown, fallback = "") {
	return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
	return typeof value === "number" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
	return typeof value === "boolean" ? value : fallback;
}

function createDoc(modulePath: string, module: DocModule): Doc {
	const slug = resolveSlug(modulePath);
	const frontmatter = module.frontmatter ?? {};
	const localPath = asString(frontmatter.to, fallbackDocPath(slug));

	return {
		availability: asString(frontmatter.availability) || undefined,
		changelogDate: asString(frontmatter.changelogDate) || undefined,
		Content: module.default,
		description: asString(frontmatter.description),
		eyebrow: asString(frontmatter.eyebrow),
		group: asString(frontmatter.group),
		hidden: asBoolean(frontmatter.hidden),
		order: asNumber(frontmatter.order),
		pageTitle: asString(frontmatter.pageTitle, asString(frontmatter.title)),
		sourcePath: modulePath,
		slug,
		summary: asString(frontmatter.summary),
		title: asString(frontmatter.title, asString(frontmatter.pageTitle)),
		to: localPath === "/" ? "/" : normalizePathname(localPath),
		version: resolveDocsVersion(frontmatter.version),
	};
}

function getVisibleDocs() {
	return flatDocs.filter((doc) => !doc.hidden);
}

export const flatDocs = Object.entries(docModules)
	.map(([modulePath, module]) => createDoc(modulePath, module))
	.sort(compareDocs);

export function getDocByPath(pathname: string) {
	const normalizedPathname = normalizePathname(pathname);

	return flatDocs.find(
		(doc) => normalizePathname(doc.to) === normalizedPathname,
	);
}

export function getDocBySlug(slug: DocSlug) {
	const doc = flatDocs.find((entry) => entry.slug === slug);

	if (!doc) {
		throw new Error(`Unknown doc: ${slug}`);
	}

	return doc;
}

function isChangelogDoc(doc: Doc) {
	return doc.group === "Changelogs";
}

export function getChangelogDocs(version?: DocsVersion) {
	return flatDocs.filter(
		(doc) => isChangelogDoc(doc) && (!version || doc.version === version),
	);
}

export function getChangelogDocBySlug(slug: DocSlug) {
	const doc = getDocBySlug(slug);

	if (!isChangelogDoc(doc)) {
		throw new Error(`Unknown changelog doc: ${slug}`);
	}

	return doc;
}

export function findDoc(pathname: string) {
	const normalizedPathname = normalizePathname(pathname);

	return (
		flatDocs.find((doc) => normalizePathname(doc.to) === normalizedPathname) ??
		getDocBySlug("overview")
	);
}

export function getDocArticleId(slug: DocSlug) {
	return `doc-${slug}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

export function getDocsGroups() {
	const groups = new Map<
		string,
		{
			items: Array<{
				title: string;
				to: string;
			}>;
			title: string;
		}
	>();

	for (const doc of getVisibleDocs()) {
		const group = groups.get(doc.group) ?? {
			items: [],
			title: doc.group,
		};

		group.items.push({
			title: doc.title,
			to: doc.to,
		});

		groups.set(doc.group, group);
	}

	return Array.from(groups.values()).sort((left, right) => {
		return (
			(groupOrderIndex.get(left.title) ?? Number.MAX_SAFE_INTEGER) -
			(groupOrderIndex.get(right.title) ?? Number.MAX_SAFE_INTEGER)
		);
	});
}

export function getAdjacentDocs(slug: DocSlug) {
	const docs = getVisibleDocs();
	const currentIndex = docs.findIndex((doc) => doc.slug === slug);

	return {
		next:
			currentIndex >= 0 && currentIndex < docs.length - 1
				? docs[currentIndex + 1]
				: null,
		previous: currentIndex > 0 ? docs[currentIndex - 1] : null,
	};
}

export function createSocialImageUrl(pathname: string) {
	const url = new URL("/og.png", siteUrl);
	url.searchParams.set("path", normalizePathname(pathname));

	return url.toString();
}

export function createDocUrl(pathname: string) {
	return new URL(normalizePathname(pathname), siteUrl).toString();
}

export function createDocHead(doc: Doc) {
	const siteName =
		doc.version === "v3" ? "Screen Transitions v3" : "Screen Transitions";
	const title =
		doc.to === "/" ? siteName : `${doc.pageTitle} | ${siteName}`;
	const socialImage = createSocialImageUrl(doc.to);
	const canonicalUrl = createDocUrl(doc.to);
	const imageAlt =
		doc.to === "/" ? "Screen Transitions" : doc.pageTitle;

	return {
		links: [{ rel: "canonical", href: canonicalUrl }],
		meta: [
			{
				title,
			},
			{
				content: doc.description,
				name: "description",
			},
			{ property: "og:type", content: "article" },
			{ property: "og:site_name", content: "Screen Transitions" },
			{ property: "og:url", content: canonicalUrl },
			{ property: "og:title", content: title },
			{ property: "og:description", content: doc.description },
			{ property: "og:image", content: socialImage },
			{ property: "og:image:type", content: "image/png" },
			{
				property: "og:image:alt",
				content: `${imageAlt} documentation preview`,
			},
			{ property: "og:image:width", content: "1200" },
			{ property: "og:image:height", content: "630" },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: doc.description },
			{ name: "twitter:image", content: socialImage },
			{
				name: "twitter:image:alt",
				content: `${imageAlt} documentation preview`,
			},
		],
	};
}
