import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/v4-next/")(
	createDocRouteConfig("v4-next", "overview"),
);
