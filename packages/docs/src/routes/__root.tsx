import { createRootRoute, Outlet } from "@tanstack/react-router";

import { DocsShell } from "../components/docs/docs-shell";
import { ThemeScript } from "../components/docs/theme-script";
import "../styles.css";

const siteDescription =
	"Build custom screen transitions, snap sheets, overlays, and bounds-driven navigation motion with the v3 API.";
const socialImage = "/og/index.png";

export const Route = createRootRoute({
	component: RootComponent,
	head: () => ({
		links: [{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }],
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
			{ property: "og:title", content: "Screen Transitions" },
			{ property: "og:description", content: siteDescription },
			{ property: "og:image", content: socialImage },
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
		<>
			<ThemeScript />
			<DocsShell>
				<Outlet />
			</DocsShell>
		</>
	);
}
