import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/migrating-to-3-4")(
	createDocRouteConfig("v3-4", "migrating-to-3-4"),
);
