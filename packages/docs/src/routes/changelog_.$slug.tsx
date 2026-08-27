import { createFileRoute } from "@tanstack/react-router";

import { MarkdownBody } from "../components/docs/markdown-doc-page";
import { createDocHead, getChangelogDocBySlug } from "../lib/docs";

export const Route = createFileRoute("/changelog_/$slug")({
	head: ({ params }) => createDocHead(getChangelogDocBySlug(params.slug)),
	component: function ChangelogEntryRouteComponent() {
		const { slug } = Route.useParams();
		const doc = getChangelogDocBySlug(slug);

		return <MarkdownBody slug={doc.slug} />;
	},
});
