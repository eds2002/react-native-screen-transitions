import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/api_/use-screen-gesture")(
	createDocRouteConfig("api/use-screen-gesture"),
);
