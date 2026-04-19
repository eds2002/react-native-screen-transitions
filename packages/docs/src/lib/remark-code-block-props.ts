import { visit } from "unist-util-visit";

export function remarkCodeBlockProps() {
	return (tree: Parameters<typeof visit>[0]) => {
		visit(tree, "code", (node: {
			data?: { hProperties?: Record<string, string> };
			meta?: string;
		}) => {
			if (!node.meta) {
				return;
			}

			const properties = (node.data ??= {}).hProperties ?? {};
			properties.metastring = node.meta;

			for (const match of node.meta.matchAll(/(\w+)="([^"]*)"/g)) {
				properties[match[1]] = match[2];
			}

			node.data.hProperties = properties;
		});
	};
}
