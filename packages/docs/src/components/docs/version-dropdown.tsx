import { Link } from "@tanstack/react-router";
import { type RefObject, useEffect, useRef, useState } from "react";

import {
	type DocVersionId,
	docVersions,
	getVersionSwitchTarget,
} from "../../lib/docs";

function ChevronIcon({ open }: { open: boolean }) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 20 20"
			className={`h-4 w-4 transition-transform duration-150 ${
				open ? "rotate-180" : ""
			}`}
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="m5.75 7.75 4.25 4.5 4.25-4.5" />
		</svg>
	);
}

function useOutsideClose(
	ref: RefObject<HTMLElement | null>,
	open: boolean,
	onClose: () => void,
) {
	useEffect(() => {
		if (!open) {
			return;
		}

		function handlePointerDown(event: MouseEvent) {
			if (!ref.current?.contains(event.target as Node)) {
				onClose();
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				onClose();
			}
		}

		document.addEventListener("mousedown", handlePointerDown);
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [onClose, open, ref]);
}

export function VersionDropdown({
	value,
	currentSlug,
	onSelect,
}: {
	value: DocVersionId;
	currentSlug: Parameters<typeof getVersionSwitchTarget>[0];
	onSelect?: () => void;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const currentVersion = docVersions.find((version) => version.id === value);
	const publicVersions = docVersions.filter((version) => version.id === "v3-4");

	useOutsideClose(containerRef, open, () => setOpen(false));

	if (publicVersions.length <= 1) {
		return (
			<div className="relative">
				<div className="inline-flex items-center gap-1 rounded-2xl px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50">
					<span>
						{publicVersions[0]?.label ?? currentVersion?.label ?? value}
					</span>
				</div>
			</div>
		);
	}

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				aria-label="Documentation version"
				aria-expanded={open}
				aria-haspopup="menu"
				onClick={() => setOpen((state) => !state)}
				className={`inline-flex items-center gap-1 rounded-2xl px-3 py-2 transition-colors duration-150 ${
					open
						? "bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-neutral-50"
						: "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
				}`}
			>
				<span className="text-sm">{currentVersion?.label ?? value}</span>
				<ChevronIcon open={open} />
			</button>

			{open ? (
				<div
					role="menu"
					aria-label="Documentation version"
					className="absolute left-0 top-full z-30 mt-3 min-w-full rounded-2xl bg-white p-1 shadow-[0_24px_80px_rgba(17,26,22,0.12)] dark:bg-[#161616] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
				>
					<div className="space-y-1">
						{publicVersions.map((version) => {
							const active = version.id === value;

							return (
								<Link
									key={version.id}
									to={getVersionSwitchTarget(currentSlug, version.id)}
									role="menuitemradio"
									aria-checked={active}
									onClick={() => {
										setOpen(false);
										onSelect?.();
									}}
									className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 ${
										active
											? "bg-neutral-100 text-neutral-950 dark:bg-white/10 dark:text-white"
											: "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-white/70 dark:hover:bg-white/6 dark:hover:text-white"
									}`}
								>
									{version.label}
								</Link>
							);
						})}
					</div>
				</div>
			) : null}
		</div>
	);
}
