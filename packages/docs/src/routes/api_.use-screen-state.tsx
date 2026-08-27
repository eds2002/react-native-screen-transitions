import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/api_/use-screen-state")(
	createDocRouteConfig("api/use-screen-state"),
);
