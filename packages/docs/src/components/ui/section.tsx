import type { ReactNode } from "react";

import { DocHeading } from "../docs/doc-heading";

export function Section({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<section className="py-10">
			<div className="max-w-3xl">
				<DocHeading
					as="h2"
					className="scroll-mt-28 text-xl font-semibold text-neutral-950 dark:text-neutral-50"
				>
					{title}
				</DocHeading>
				{description ? (
					<p className="mt-3 text-neutral-950 dark:text-neutral-50">
						{description}
					</p>
				) : null}
			</div>
			<div className="mt-6">{children}</div>
		</section>
	);
}
