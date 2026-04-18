export function InfoGrid({
	items,
}: {
	items: ReadonlyArray<{ title: string; copy: string }>;
}) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{items.map((item) => (
				<div
					key={item.title}
					className="rounded-3xl bg-neutral-100 p-5 dark:bg-neutral-900"
				>
					<h3 className="font-medium text-neutral-950 dark:text-neutral-50">
						{item.title}
					</h3>
					<p className="mt-2 text-neutral-600 dark:text-neutral-400">
						{item.copy}
					</p>
				</div>
			))}
		</div>
	);
}
