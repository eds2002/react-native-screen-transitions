export function BulletList({ items }: { items: ReadonlyArray<string> }) {
	return (
		<ul className="space-y-3 text-neutral-600 dark:text-neutral-400">
			{items.map((item) => (
				<li key={item} className="flex gap-3">
					<span className="mt-2 h-1.5 w-1.5 rounded-full bg-neutral-950 dark:bg-neutral-50" />
					<span>{item}</span>
				</li>
			))}
		</ul>
	);
}
