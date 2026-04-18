import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/transition-components")(
	createDocRouteConfig("v3-4", "transition-components"),
);
