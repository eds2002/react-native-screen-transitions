import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
	title: "react-native-screen-transitions",
	tagline:
		"Gesture-first transitions, shared elements, and release-ready docs for React Native.",
	favicon: "img/favicon.svg",
	future: {
		v4: true,
	},
	url: "https://eds2002.github.io",
	baseUrl: "/react-native-screen-transitions/",
	organizationName: "eds2002",
	projectName: "react-native-screen-transitions",
	onBrokenLinks: "throw",
	trailingSlash: false,
	markdown: {
		hooks: {
			onBrokenMarkdownLinks: "warn",
		},
	},
	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},
	presets: [
		[
			"classic",
			{
				docs: {
					sidebarPath: "./sidebars.ts",
					lastVersion: "3.x",
					versions: {
						current: {
							label: "Next",
							path: "next",
							banner: "unreleased",
						},
						"3.x": {
							label: "3.x",
							banner: "none",
						},
					},
					editUrl:
						"https://github.com/eds2002/react-native-screen-transitions/tree/main/apps/docs/",
				},
				blog: false,
				theme: {
					customCss: "./src/css/custom.css",
				},
			} satisfies Preset.Options,
		],
	],
	themeConfig: {
		colorMode: {
			defaultMode: "light",
			respectPrefersColorScheme: true,
		},
		navbar: {
			title: "screen transitions",
			logo: {
				alt: "react-native-screen-transitions logo",
				src: "img/logo.svg",
			},
			items: [
				{
					type: "docSidebar",
					sidebarId: "docsSidebar",
					position: "left",
					label: "Docs",
				},
				{
					type: "docsVersionDropdown",
					position: "left",
					dropdownActiveClassDisabled: true,
				},
				{
					type: "search",
					position: "right",
				},
				{
					href: "https://github.com/eds2002/react-native-screen-transitions",
					position: "right",
					className: "header-github-link",
					"aria-label": "GitHub repository",
				},
			],
		},
		footer: {
			style: "light",
			links: [
				{
					title: "Docs",
					items: [
						{
							label: "Overview",
							to: "/docs/intro",
						},
						{
							label: "Quickstart",
							to: "/docs/getting-started/quickstart",
						},
						{
							label: "API Reference",
							to: "/docs/api",
						},
					],
				},
				{
					title: "Release Flow",
					items: [
						{
							label: "Stable 3.x",
							to: "/docs/release-notes/3-3-stable",
						},
						{
							label: "Next Train",
							to: "/docs/next/release-notes/3-4-next",
						},
					],
				},
				{
					title: "Package",
					items: [
						{
							label: "GitHub",
							href: "https://github.com/eds2002/react-native-screen-transitions",
						},
						{
							label: "npm",
							href: "https://www.npmjs.com/package/react-native-screen-transitions",
						},
						{
							label: "Example App",
							href: "https://github.com/eds2002/react-native-screen-transitions/tree/main/apps/e2e",
						},
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} Ed.`,
		},
		docs: {
			sidebar: {
				hideable: false,
				autoCollapseCategories: true,
			},
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.oneDark,
		},
	} satisfies Preset.ThemeConfig,
};

export default config;
