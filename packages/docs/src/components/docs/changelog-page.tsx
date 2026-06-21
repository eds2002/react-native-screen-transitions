import {
	createDocHead,
	type DocVersionId,
	getChangelogDocs,
	getDocArticleId,
	getDocByVersionAndSlug,
} from "../../lib/docs";
import { PageIntro } from "../ui/page-intro";
import { PageLinks } from "../ui/page-links";
import { DocHeading } from "./doc-heading";
import { markdownArticleClassName, mdxComponents } from "./markdown-doc-page";

function ChangelogPage({ versionId }: { versionId: DocVersionId }) {
	const doc = getDocByVersionAndSlug(versionId, "changelog");
	const [latest, ...olderUpdates] = getChangelogDocs(versionId);
	const LatestContent = latest?.Content;

	return (
		<>
			<PageIntro
				eyebrow={doc.eyebrow}
				title={doc.pageTitle}
				lede={doc.description}
			/>

			<article
				id={getDocArticleId(versionId, doc.slug)}
				className={markdownArticleClassName}
			>
				{latest && LatestContent ? (
					<>
						<DocHeading
							as="h2"
							id={latest.slug}
							className="scroll-mt-28 text-2xl font-medium text-neutral-950 dark:text-neutral-50"
						>
							{latest.pageTitle}
						</DocHeading>
						<LatestContent components={mdxComponents} />
					</>
				) : (
					<p className="max-w-[46rem] text-neutral-600 dark:text-neutral-400">
						No changelog entries have been published yet.
					</p>
				)}

				{olderUpdates.length > 0 ? (
					<section className="mt-14 border-t border-black/10 pt-10 dark:border-white/14">
						<DocHeading
							as="h2"
							className="scroll-mt-28 text-2xl font-medium text-neutral-950 dark:text-neutral-50"
						>
							More Updates
						</DocHeading>
						<div className="mt-6">
							<PageLinks
								indicator="eyebrow"
								items={olderUpdates.map((update) => ({
									copy: update.summary,
									direction: "previous" as const,
									eyebrow: update.changelogDate,
									title: update.pageTitle,
									to: update.to,
								}))}
							/>
						</div>
					</section>
				) : null}
			</article>
		</>
	);
}

export function createChangelogRouteConfig(versionId: DocVersionId) {
	const doc = getDocByVersionAndSlug(versionId, "changelog");

	return {
		head: () => createDocHead(doc),
		component: function ChangelogRouteComponent() {
			return <ChangelogPage versionId={versionId} />;
		},
	};
}
