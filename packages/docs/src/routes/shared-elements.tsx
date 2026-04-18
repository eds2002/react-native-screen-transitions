import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/shared-elements")(
	createDocRouteConfig("v3-4", "shared-elements"),
);
