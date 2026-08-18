import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/api_/create-transition-aware-component")(
	createDocRouteConfig("api/create-transition-aware-component"),
);
