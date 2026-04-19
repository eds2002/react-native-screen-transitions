import { RouterProvider } from "@tanstack/react-router";
import { Component, type ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { getRouter } from "./router";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Missing #root element");
}

const router = getRouter();

class AppErrorBoundary extends Component<
	{ children: ReactNode },
	{ error: Error | null }
> {
	override state: Readonly<{ error: Error | null }> = { error: null };

	static getDerivedStateFromError(error: Error) {
		return { error };
	}

	render() {
		if (this.state.error) {
			return (
				<div className="min-h-screen bg-black px-6 py-10 font-mono text-sm text-red-200">
					<p className="font-semibold text-red-100">
						The docs app failed to load.
					</p>
					<p className="mt-4 text-red-300">Reload the page and try again.</p>
					{import.meta.env.DEV ? (
						<pre className="mt-4 whitespace-pre-wrap">
							{this.state.error.stack ?? this.state.error.message}
						</pre>
					) : null}
				</div>
			);
		}

		return this.props.children;
	}
}

createRoot(rootElement).render(
	<StrictMode>
		<AppErrorBoundary>
			<RouterProvider router={router} />
		</AppErrorBoundary>
	</StrictMode>,
);
