import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig, type Plugin } from "vite";

import { remarkCodeBlockProps } from "./src/lib/remark-code-block-props";

const mdxPlugin = mdx({
	remarkPlugins: [
		remarkGfm,
		remarkFrontmatter,
		[remarkMdxFrontmatter, { name: "frontmatter" }],
		remarkCodeBlockProps,
	],
}) as Plugin;

mdxPlugin.enforce = "pre";

export default defineConfig({
	resolve: {
		dedupe: ["react", "react-dom"],
	},
	server: {
		port: 3000,
	},
	plugins: [
		mdxPlugin,
		react({
			include: /\.(mdx|js|jsx|ts|tsx)$/,
		}),
		tailwindcss(),
	],
});
