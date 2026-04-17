import { Link } from "@tanstack/react-router";

export function PageLinks({
	items,
}: {
	items: ReadonlyArray<{
		copy?: string;
		direction: "next" | "previous";
		eyebrow?: string;
		title: string;
		to: string;
	}>;
}) {
	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{items.map((item, index) => {
				const reverse = item.direction === "next";
				const soloNext = items.length === 1 && item.direction === "next";

				return (
					<Link
						key={item.to}
						to={item.to}
						className={`group flex min-h-28 flex-col justify-between rounded-3xl bg-neutral-100 p-5 transition-colors duration-150 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 ${
							reverse ? "text-right" : "text-left"
						} ${soloNext ? "sm:col-start-2" : ""}`}
					>
						<div
							className={`flex items-center text-neutral-500 dark:text-neutral-400 mb-2 ${
								reverse ? "justify-end" : "justify-start"
							}`}
						>
							{reverse ? (
								<ArrowIcon direction="right" />
							) : (
								<ArrowIcon direction="left" />
							)}
						</div>
						<div className={reverse ? "self-end" : undefined}>
							<p className="text-base font-medium text-neutral-950 dark:text-neutral-50">
								{item.title}
							</p>
							{item.copy ? (
								<p className="w-full text-sm text-neutral-600 dark:text-neutral-400">
									{item.copy}
								</p>
							) : null}
						</div>
					</Link>
				);
			})}
		</div>
	);
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 20 20"
			className="h-5 w-5"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			{direction === "right" ? (
				<path d="M4.75 10h10.5m-4-4 4 4-4 4" />
			) : (
				<path d="M15.25 10H4.75m4 4-4-4 4-4" />
			)}
		</svg>
	);
}
