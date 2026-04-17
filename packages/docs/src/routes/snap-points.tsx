import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/snap-points")(
	createDocRouteConfig("v3-4", "snap-points"),
);
