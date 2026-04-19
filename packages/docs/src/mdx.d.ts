declare module "*.mdx" {
	import type { ComponentType } from "react";

	const MDXContent: ComponentType<Record<string, unknown>>;
	export const frontmatter: Record<string, unknown>;
	export default MDXContent;
}
