import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/api/use-history")(
	createDocRouteConfig("v3-4", "api/use-history"),
);
