import {
	createDocHead,
	type DocsVersion,
	getChangelogDocs,
	getDocArticleId,
	getDocBySlug,
} from "../../lib/docs";
import { PageIntro } from "../ui/page-intro";
import { PageLinks } from "../ui/page-links";
import { DocHeading } from "./doc-heading";

function ChangelogSection({
	description,
	title,
	version,
}: {
	description: string;
	title: string;
	version: DocsVersion;
}) {
	const updates = getChangelogDocs(version);

	return (
		<section className="mt-14 border-t border-black/10 pt-10 first:mt-0 first:border-t-0 first:pt-0 dark:border-white/14">
			<DocHeading
				as="h2"
				id={version}
				className="scroll-mt-28 text-2xl font-medium text-neutral-950 dark:text-neutral-50"
			>
				{title}
			</DocHeading>
			<p className="mt-3 max-w-[46rem] text-neutral-600 dark:text-neutral-400">
				{description}
			</p>

			{updates.length > 0 ? (
				<div className="mt-6">
					<PageLinks
						indicator="eyebrow"
						items={updates.map((update) => ({
							copy: update.summary,
							direction: "previous" as const,
							eyebrow: update.changelogDate,
							title: update.pageTitle,
							to: update.to,
						}))}
					/>
				</div>
			) : (
				<p className="mt-6 max-w-[46rem] text-neutral-600 dark:text-neutral-400">
					No updates have been published for this release line yet.
				</p>
			)}
		</section>
	);
}

function ChangelogPage() {
	const doc = getDocBySlug("changelog");

	return (
		<>
			<PageIntro
				eyebrow={doc.eyebrow}
				title={doc.pageTitle}
				lede={doc.description}
			/>

			<article id={getDocArticleId(doc.slug)} className="mt-10 min-w-0">
				<ChangelogSection
					version="v4"
					title="Version 4"
					description="The current release line, including new capabilities and migration notes."
				/>
				<ChangelogSection
					version="v3"
					title="Version 3"
					description="Maintained for fixes. Version 3 receives patches, but no new features."
				/>
			</article>
		</>
	);
}

export function createChangelogRouteConfig() {
	const doc = getDocBySlug("changelog");

	return {
		head: () => createDocHead(doc),
		component: function ChangelogRouteComponent() {
			return <ChangelogPage />;
		},
	};
}
