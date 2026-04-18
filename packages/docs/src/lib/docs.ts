import type { ComponentType } from "react";

export type DocVersionId = "v3-4" | "v4-next";
export type DocSlug = string;

type DocFrontmatter = {
	availability?: string;
	description: string;
	eyebrow: string;
	group: string;
	hidden?: boolean;
	order: number;
	pageTitle: string;
	summary: string;
	title: string;
	to: string;
};

type DocModule = {
	default: ComponentType<Record<string, unknown>>;
	frontmatter?: Partial<DocFrontmatter>;
};

type DocVersion = {
	basePath: string;
	id: DocVersionId;
	label: string;
};

type Doc = {
	availability?: string;
	Content: ComponentType<Record<string, unknown>>;
	description: string;
	eyebrow: string;
	group: string;
	hidden: boolean;
	order: number;
	pageTitle: string;
	slug: DocSlug;
	summary: string;
	title: string;
	to: string;
	versionId: DocVersionId;
};

const docModules = import.meta.glob<DocModule>("../content/docs/**/*.mdx", {
	eager: true,
});

const groupOrder = ["Get Started", "Core Concepts", "Components", "Guides"];
const groupOrderIndex = new Map(
	groupOrder.map((group, index) => [group, index] as const),
);

export const docVersions = [
	{
		basePath: "",
		id: "v3-4",
		label: "v3.4",
	},
	{
		basePath: "/v4-next",
		id: "v4-next",
		label: "v4 Preview",
	},
] as const satisfies ReadonlyArray<DocVersion>;

const versionIndex = new Map(
	docVersions.map((version, index) => [version.id, index] as const),
);

function normalizePathname(pathname: string) {
	if (pathname.length > 1 && pathname.endsWith("/")) {
		return pathname.slice(0, -1);
	}

	return pathname;
}

function getVersionBasePath(versionId: DocVersionId) {
	return docVersions.find((version) => version.id === versionId)?.basePath ?? "";
}

function createDocPath(versionId: DocVersionId, to: string) {
	if (versionId === "v3-4") {
		return to === "/" ? "/" : normalizePathname(to);
	}

	const basePath = getVersionBasePath(versionId);

	if (to === "/") {
		return `${basePath}/`;
	}

	return `${basePath}${normalizePathname(to)}`;
}

function fallbackDocPath(slug: DocSlug) {
	return slug === "overview" ? "/" : `/${slug}`;
}

function resolveVersionAndSlug(modulePath: string) {
	const relativePath = modulePath
		.replace("../content/docs/", "")
		.replace(/\.mdx$/, "");

	if (relativePath.startsWith("v4-next/")) {
		return {
			slug: relativePath.slice("v4-next/".length),
			versionId: "v4-next" as const,
		};
	}

	return {
		slug: relativePath,
		versionId: "v3-4" as const,
	};
}

function compareDocs(left: Doc, right: Doc) {
	const versionDelta =
		(versionIndex.get(left.versionId) ?? Number.MAX_SAFE_INTEGER) -
		(versionIndex.get(right.versionId) ?? Number.MAX_SAFE_INTEGER);

	if (versionDelta !== 0) {
		return versionDelta;
	}

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
	const { slug, versionId } = resolveVersionAndSlug(modulePath);
	const frontmatter = module.frontmatter ?? {};
	const localPath = asString(frontmatter.to, fallbackDocPath(slug));

	return {
		availability: asString(frontmatter.availability) || undefined,
		Content: module.default,
		description: asString(frontmatter.description),
		eyebrow: asString(frontmatter.eyebrow),
		group: asString(frontmatter.group),
		hidden: asBoolean(frontmatter.hidden),
		order: asNumber(frontmatter.order),
		pageTitle: asString(frontmatter.pageTitle, asString(frontmatter.title)),
		slug,
		summary: asString(frontmatter.summary),
		title: asString(frontmatter.title, asString(frontmatter.pageTitle)),
		to: createDocPath(versionId, localPath),
		versionId,
	};
}

function getDocsForVersion(versionId: DocVersionId) {
	return flatDocs.filter((doc) => doc.versionId === versionId);
}

function getVisibleDocsForVersion(versionId: DocVersionId) {
	return getDocsForVersion(versionId).filter((doc) => !doc.hidden);
}

export const flatDocs = Object.entries(docModules)
	.map(([modulePath, module]) => createDoc(modulePath, module))
	.sort(compareDocs);

export function getDocVersion(versionId: DocVersionId) {
	const version = docVersions.find((entry) => entry.id === versionId);

	if (!version) {
		throw new Error(`Unknown doc version: ${versionId}`);
	}

	return version;
}

export function getDocByVersionAndSlug(versionId: DocVersionId, slug: DocSlug) {
	const doc = flatDocs.find(
		(entry) => entry.versionId === versionId && entry.slug === slug,
	);

	if (!doc) {
		throw new Error(`Unknown doc: ${versionId}/${slug}`);
	}

	return doc;
}

export function findDoc(pathname: string) {
	const normalizedPathname = normalizePathname(pathname);

	return (
		flatDocs.find((doc) => normalizePathname(doc.to) === normalizedPathname) ??
		getDocByVersionAndSlug("v3-4", "overview")
	);
}

export function getDocArticleId(versionId: DocVersionId, slug: DocSlug) {
	return `doc-${versionId}-${slug}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

export function getDocsGroups(versionId: DocVersionId) {
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

	for (const doc of getVisibleDocsForVersion(versionId)) {
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

export function getAdjacentDocs(versionId: DocVersionId, slug: DocSlug) {
	const docs = getVisibleDocsForVersion(versionId);
	const currentIndex = docs.findIndex((doc) => doc.slug === slug);

	return {
		next:
			currentIndex >= 0 && currentIndex < docs.length - 1
				? docs[currentIndex + 1]
				: null,
		previous: currentIndex > 0 ? docs[currentIndex - 1] : null,
	};
}

export function getVersionSwitchTarget(
	currentSlug: DocSlug,
	versionId: DocVersionId,
) {
	const sameSlug = getVisibleDocsForVersion(versionId).find(
		(doc) => doc.slug === currentSlug,
	);

	if (sameSlug) {
		return sameSlug.to;
	}

	return getVisibleDocsForVersion(versionId)[0]?.to ?? "/";
}

export function createDocHead(doc: Doc) {
	return {
		meta: [
			{
				title:
					doc.to === "/" ? "Screen Transitions" : `${doc.pageTitle} | Screen Transitions`,
			},
			{
				content: doc.description,
				name: "description",
			},
		],
	};
}
