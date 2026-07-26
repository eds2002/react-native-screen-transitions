import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/v4-experimental/")(
	createDocRouteConfig("v4-experimental", "overview"),
);
