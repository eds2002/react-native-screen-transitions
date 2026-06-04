import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/inactive-behavior")(
	createDocRouteConfig("v3-4", "inactive-behavior"),
);
