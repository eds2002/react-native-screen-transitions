import { createRootRoute, Outlet } from "@tanstack/react-router";

import { DocsShell } from "../components/docs/docs-shell";
import { ThemeScript } from "../components/docs/theme-script";
import "../styles.css";

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
				content:
					"TanStack Start docs prototype for react-native-screen-transitions.",
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
