import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/api/create-boundary-component")(
	createDocRouteConfig("v3-4", "api/create-boundary-component"),
);
