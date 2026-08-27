import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/native-stack-adapter")(
	createDocRouteConfig("native-stack-adapter"),
);
