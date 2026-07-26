import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";

import { DocsShell } from "../components/docs/docs-shell";
import { ThemeScript } from "../components/docs/theme-script";
import { createDocUrl, createSocialImageUrl } from "../lib/docs";
import "../styles.css";

const siteDescription =
	"Build custom screen transitions, snap sheets, overlays, and bounds-driven navigation motion with the v3 API.";
const socialImage = createSocialImageUrl("/");
const canonicalUrl = createDocUrl("/");

export const Route = createRootRoute({
	component: RootComponent,
	head: () => ({
		links: [
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "canonical", href: canonicalUrl },
		],
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Screen Transitions" },
			{
				name: "description",
				content: siteDescription,
			},
			{ property: "og:type", content: "website" },
			{ property: "og:site_name", content: "Screen Transitions" },
			{ property: "og:url", content: canonicalUrl },
			{ property: "og:title", content: "Screen Transitions" },
			{ property: "og:description", content: siteDescription },
			{ property: "og:image", content: socialImage },
			{ property: "og:image:type", content: "image/png" },
			{
				property: "og:image:alt",
				content: "Screen Transitions documentation preview",
			},
			{ property: "og:image:width", content: "1200" },
			{ property: "og:image:height", content: "630" },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: "Screen Transitions" },
			{ name: "twitter:description", content: siteDescription },
			{ name: "twitter:image", content: socialImage },
			{
				name: "twitter:image:alt",
				content: "Screen Transitions documentation preview",
			},
		],
	}),
});

function RootComponent() {
	return (
		<html lang="en" data-theme="dark" data-theme-mode="dark">
			<head>
				<HeadContent />
				<ThemeScript />
			</head>
			<body className="min-h-screen bg-white dark:bg-neutral-950">
				<DocsShell>
					<Outlet />
				</DocsShell>
				<Scripts />
			</body>
		</html>
	);
}
