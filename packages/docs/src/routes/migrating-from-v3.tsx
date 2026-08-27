import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/migrating-from-v3")(
	createDocRouteConfig("migrating-from-v3"),
);
