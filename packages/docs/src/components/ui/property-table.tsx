import type { ReactNode } from "react";

export function PropertyTable({ children }: { children: ReactNode }) {
	return (
		<div className="mt-4 max-w-[46rem] overflow-hidden rounded-3xl border border-black/10 text-sm dark:border-white/14 [&>div]:max-w-none [&_table]:table-fixed [&_tbody_tr+tr_td]:border-t [&_tbody_tr+tr_td]:border-black/10 dark:[&_tbody_tr+tr_td]:border-white/14 [&_td]:whitespace-normal [&_th]:whitespace-normal">
			{children}
		</div>
	);
}
