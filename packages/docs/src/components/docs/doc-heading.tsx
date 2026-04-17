import type { ReactNode } from "react";

import { flattenReactText, slugifyHeading } from "../../utils/headings";

export function DocHeading({
	as,
	children,
	className,
	id,
}: {
	as: "h2" | "h3";
	children: ReactNode;
	className?: string;
	id?: string;
}) {
	const title = flattenReactText(children).trim();
	const resolvedId = id ?? (title ? slugifyHeading(title) : undefined);
	const Component = as;

	return (
		<Component
			id={resolvedId}
			data-doc-heading="true"
			data-doc-heading-level={as === "h3" ? "3" : "2"}
			data-doc-heading-text={title || undefined}
			className={className}
		>
			{children}
		</Component>
	);
}
