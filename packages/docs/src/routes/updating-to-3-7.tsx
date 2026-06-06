import { createFileRoute } from "@tanstack/react-router";

import { createDocRouteConfig } from "../components/docs/markdown-doc-page";

export const Route = createFileRoute("/updating-to-3-7")(
	createDocRouteConfig("v3-4", "updating-to-3-7"),
);
