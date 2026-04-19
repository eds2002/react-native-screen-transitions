import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/expo-router")(
	createDocRouteConfig("v3-4", "expo-router"),
);
