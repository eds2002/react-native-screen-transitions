import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/updating-to-3-6")(
	createDocRouteConfig("v3-4", "updating-to-3-6"),
);
