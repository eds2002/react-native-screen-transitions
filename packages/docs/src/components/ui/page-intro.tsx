export function PageIntro({
	availability,
	eyebrow,
	title,
	lede,
	image,
}: {
	availability?: string;
	eyebrow: string;
	title: string;
	lede: string;
	image?: string;
}) {
	return (
		<header className="">
			<div
				className={
					image
						? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"
						: "grid gap-8"
				}
			>
				<div className="min-w-0">
					<p className="text-sm text-neutral-500 dark:text-neutral-400">
						{eyebrow}
					</p>
					<h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-neutral-950 dark:text-neutral-50">
						{title}
					</h1>
					<p className="mt-3 max-w-2xl text-base leading-7 text-pretty text-neutral-600 dark:text-neutral-400">
						{lede}
					</p>
					{availability ? (
						<div className="mt-6">
							<p className="inline-flex rounded-2xl bg-neutral-100 p-3 text-sm font-medium text-neutral-950 dark:bg-neutral-900 dark:text-neutral-50">
								{availability}
							</p>
						</div>
					) : null}
				</div>
			</div>
		</header>
	);
}
