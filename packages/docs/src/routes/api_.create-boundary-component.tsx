import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/api_/create-boundary-component")(
	createDocRouteConfig("api/create-boundary-component"),
);
