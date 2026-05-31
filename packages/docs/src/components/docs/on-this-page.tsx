import { useEffect, useState } from "react";

import { slugifyHeading } from "../../utils/headings";

type TocItem = {
	id: string;
	level: 2 | 3;
	title: string;
};

function collectHeadings(articleId: string) {
	const article = document.getElementById(articleId);

	if (!article) {
		return [];
	}

	const seenIds = new Map<string, number>();

	return Array.from(
		article.querySelectorAll<HTMLElement>('[data-doc-heading="true"]'),
	)
		.map((node) => {
			const title =
				node.dataset.docHeadingText?.trim() ?? node.textContent?.trim();

			if (!title) {
				return null;
			}

			const baseId = node.id || slugifyHeading(title) || "section";
			const nextCount = (seenIds.get(baseId) ?? 0) + 1;
			seenIds.set(baseId, nextCount);

			const resolvedId = nextCount > 1 ? `${baseId}-${nextCount}` : baseId;
			if (node.id !== resolvedId) {
				node.id = resolvedId;
			}

			return {
				id: resolvedId,
				level: node.dataset.docHeadingLevel === "3" ? 3 : 2,
				title,
			} satisfies TocItem;
		})
		.filter((item): item is TocItem => item !== null);
}

export function OnThisPage({ articleId }: { articleId: string }) {
	const [items, setItems] = useState<TocItem[]>([]);
	const [activeId, setActiveId] = useState<string>();

	useEffect(() => {
		function syncHeadings() {
			const article = document.getElementById(articleId);

			if (!article) {
				return false;
			}

			const nextItems = collectHeadings(articleId);
			setItems(nextItems);
			setActiveId((current) =>
				current && nextItems.some((item) => item.id === current)
					? current
					: nextItems[0]?.id,
			);

			return true;
		}

		if (syncHeadings()) {
			return;
		}

		const observer = new MutationObserver(() => {
			if (syncHeadings()) {
				observer.disconnect();
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		return () => {
			observer.disconnect();
		};
	}, [articleId]);

	useEffect(() => {
		if (items.length === 0) {
			return;
		}

		let frame = 0;

		function updateActiveHeading() {
			const headingElements = items
				.map((item) => document.getElementById(item.id))
				.filter((element): element is HTMLElement => element !== null);

			if (headingElements.length === 0) {
				return;
			}

			const threshold = window.scrollY + 164;
			let nextActiveId = headingElements[0].id;

			for (const element of headingElements) {
				if (threshold >= element.offsetTop) {
					nextActiveId = element.id;
				}
			}

			setActiveId((current) =>
				current === nextActiveId ? current : nextActiveId,
			);
		}

		function scheduleUpdate() {
			if (frame !== 0) {
				return;
			}

			frame = window.requestAnimationFrame(() => {
				frame = 0;
				updateActiveHeading();
			});
		}

		scheduleUpdate();

		window.addEventListener("scroll", scheduleUpdate, { passive: true });
		window.addEventListener("resize", scheduleUpdate);

		return () => {
			window.removeEventListener("scroll", scheduleUpdate);
			window.removeEventListener("resize", scheduleUpdate);

			if (frame !== 0) {
				window.cancelAnimationFrame(frame);
			}
		};
	}, [items]);

	if (items.length === 0) {
		return null;
	}

	return (
		<div>
			<p className="mb-3 text-neutral-400 text-xs">On This Page</p>
			<nav className="mt-4">
				<ul className="">
					{items.map((item) => {
						const isActive = item.id === activeId;

						return (
							<li
								key={item.id}
								className={
									isActive
										? "text-neutral-950 dark:text-neutral-50"
										: "text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 dark:text-neutral-600"
								}
							>
								<a
									href={`#${item.id}`}
									onClick={() => setActiveId(item.id)}
									className={`relative block pb-3 text-sm  transition-colors duration-150 ${
										item.level === 3 ? "pl-4" : ""
									} ${
										isActive
											? "text-neutral-950 dark:text-neutral-50"
											: "text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-50 dark:text-neutral-400"
									}`}
								>
									{item.title}
								</a>
							</li>
						);
					})}
				</ul>
			</nav>
		</div>
	);
}
