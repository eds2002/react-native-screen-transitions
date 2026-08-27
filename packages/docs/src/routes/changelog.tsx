import { createFileRoute } from "@tanstack/react-router";

import { createChangelogRouteConfig } from "../components/docs/changelog-page";

export const Route = createFileRoute("/changelog")(
	createChangelogRouteConfig(),
);
