import { createFileRoute } from "@tanstack/react-router";

import { MarkdownBody } from "../components/docs/markdown-doc-page";
import { createDocHead, getChangelogDocBySlug } from "../lib/docs";

export const Route = createFileRoute("/changelog/$slug")({
	head: ({ params }) =>
		createDocHead(getChangelogDocBySlug("v3-4", params.slug)),
	component: function ChangelogEntryRouteComponent() {
		const { slug } = Route.useParams();
		const doc = getChangelogDocBySlug("v3-4", slug);

		return <MarkdownBody versionId="v3-4" slug={doc.slug} />;
	},
});
