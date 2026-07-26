declare module "*.mdx" {
	import type { ComponentType } from "react";

	const MDXContent: ComponentType<Record<string, unknown>>;
	export const frontmatter: Record<string, unknown>;
	export default MDXContent;
}

declare module "virtual:docs-search-index" {
	export const docSearchTextByModulePath: Readonly<Record<string, string>>;
}
