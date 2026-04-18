import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

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
		<RootDocument>
			<DocsShell>
				<Outlet />
			</DocsShell>
		</RootDocument>
	);
}

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			data-theme="dark"
			data-theme-mode="dark"
			suppressHydrationWarning
		>
			<head>
				<HeadContent />
				<ThemeScript />
			</head>
			<body className="min-h-screen bg-white dark:bg-neutral-950">
				{children}
				<Scripts />
			</body>
		</html>
	);
}
