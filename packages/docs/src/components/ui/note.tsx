import type { ReactNode } from "react";

export function Note({ children }: { children: ReactNode }) {
	return (
		<div className="rounded-3xl bg-neutral-100 p-6 dark:bg-neutral-900">
			<p>{children}</p>
		</div>
	);
}
