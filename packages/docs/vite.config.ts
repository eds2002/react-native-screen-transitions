import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import mdx from "@mdx-js/rollup";
import netlify from "@netlify/vite-plugin-tanstack-start";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
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

const searchIndexModuleId = "virtual:docs-search-index";
const resolvedSearchIndexModuleId = `\0${searchIndexModuleId}`;

function collectMdxFiles(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = resolve(directory, entry.name);

		if (entry.isDirectory()) {
			return collectMdxFiles(path);
		}

		return entry.isFile() && entry.name.endsWith(".mdx") ? [path] : [];
	});
}

function docsSearchIndex(): Plugin {
	const contentDirectory = resolve(import.meta.dirname, "src/content/docs");

	return {
		name: "docs-search-index",
		resolveId(id) {
			return id === searchIndexModuleId
				? resolvedSearchIndexModuleId
				: undefined;
		},
		load(id) {
			if (id !== resolvedSearchIndexModuleId) {
				return undefined;
			}

			const index = Object.fromEntries(
				collectMdxFiles(contentDirectory).map((file) => [
					`../content/docs/${relative(contentDirectory, file).replaceAll("\\", "/")}`,
					readFileSync(file, "utf8"),
				]),
			);

			return `export const docSearchTextByModulePath = ${JSON.stringify(index)};`;
		},
	};
}

export default defineConfig({
	build: {
		ssrEmitAssets: true,
	},
	resolve: {
		dedupe: ["react", "react-dom"],
	},
	optimizeDeps: {
		exclude: ["@resvg/resvg-js"],
	},
	server: {
		port: 3000,
	},
	plugins: [
		docsSearchIndex(),
		mdxPlugin,
		tanstackStart({
			prerender: {
				enabled: true,
				crawlLinks: true,
				failOnError: true,
			},
		}),
		react({
			include: /\.(mdx|js|jsx|ts|tsx)$/,
		}),
		tailwindcss(),
		netlify(),
	],
});
