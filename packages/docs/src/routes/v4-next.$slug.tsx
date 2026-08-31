import { createFileRoute } from "@tanstack/react-router";

import { MarkdownBody } from "../components/docs/markdown-doc-page";
import { createDocHead, getDocByVersionAndSlug } from "../lib/docs";

export const Route = createFileRoute("/v4-next/$slug")({
	head: ({ params }) =>
		createDocHead(getDocByVersionAndSlug("v4-next", params.slug)),
	component: function V4DocRouteComponent() {
		const { slug } = Route.useParams();
		const doc = getDocByVersionAndSlug("v4-next", slug);

		return <MarkdownBody versionId="v4-next" slug={doc.slug} />;
	},
});
