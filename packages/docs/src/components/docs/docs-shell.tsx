import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import {
	findDoc,
	flatDocs,
	getDocArticleId,
	getDocsGroups,
	getDocVersion,
} from "../../lib/docs";
import { HeaderThemeToggle } from "../ui/header-theme-toggle";
import { OnThisPage } from "./on-this-page";
import { VersionDropdown } from "./version-dropdown";

const githubStarsLabel = "1.4k";

function MenuButton({ open, onClick }: { open: boolean; onClick: () => void }) {
	return (
		<button
			type="button"
			aria-controls="mobile-docs-dialog"
			aria-expanded={open}
			aria-label={open ? "Close navigation menu" : "Open navigation menu"}
			onClick={onClick}
			className="inline-flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors duration-150 dark:text-neutral-400 lg:hidden"
		>
			<span className="flex flex-col gap-1.5 w-5">
				<span className="h-0.5 rounded-full w-5 bg-current transition-transform duration-150" />
				<span className="h-0.5 w-5 bg-current transition-transform duration-150" />
			</span>
		</button>
	);
}

function LogoMark({ className = "text-white" }: { className?: string }) {
	return (
		<span
			className={`relative flex h-6 w-6 items-center justify-center ${className}`}
		>
			<span className="left-1 relative scale-[0.9] h-[1.45rem] w-[0.8rem] rounded-md bg-neutral-300 dark:bg-neutral-500" />
			<span className="h-[1.45rem] z-10 w-[0.8rem] rounded-md bg-neutral-600 dark:bg-neutral-50" />
		</span>
	);
}

function SearchIcon() {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 20 20"
			className="h-4 w-4"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="9" cy="9" r="5.25" />
			<path d="M13.2 13.2 16.5 16.5" />
		</svg>
	);
}

function GithubIcon() {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			className="h-4.5 w-4.5"
			fill="currentColor"
		>
			<path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.76-.24.76-.55v-2.1c-3.1.68-3.75-1.3-3.75-1.3-.5-1.28-1.23-1.62-1.23-1.62-1-.68.08-.66.08-.66 1.12.08 1.7 1.14 1.7 1.14.98 1.68 2.57 1.2 3.2.91.1-.72.38-1.2.68-1.48-2.48-.28-5.08-1.24-5.08-5.51 0-1.22.43-2.22 1.14-3-.12-.28-.5-1.42.1-2.96 0 0 .94-.3 3.07 1.14a10.57 10.57 0 0 1 5.6 0c2.13-1.44 3.07-1.14 3.07-1.14.6 1.54.22 2.68.11 2.96.7.78 1.13 1.78 1.13 3 0 4.28-2.61 5.23-5.1 5.5.4.35.76 1.03.76 2.08v3.08c0 .3.2.66.77.55A11.25 11.25 0 0 0 12 .75Z" />
		</svg>
	);
}

function HeaderSearch({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="hidden min-w-0 items-center gap-2.5 rounded-full bg-neutral-100 px-3 py-2 text-left text-sm text-neutral-500 transition-colors duration-150 hover:bg-neutral-200 hover:text-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 xl:flex xl:w-[280px]"
			aria-label="Search documentation"
		>
			<SearchIcon />
			<span className="truncate">Search documentation...</span>
			<span className="ml-auto rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-500">
				⌘K
			</span>
		</button>
	);
}

function HeaderMetric({
	children,
	href,
	label,
	value,
}: {
	children: ReactNode;
	href: string;
	label: string;
	value: string;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			aria-label={label}
			className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-neutral-600 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
		>
			{children}
			<span className="min-w-0 text-sm ">{value}</span>
		</a>
	);
}

function DocsNavigation({
	groups,
	onNavigate,
}: {
	groups: ReturnType<typeof getDocsGroups>;
	onNavigate?: () => void;
}) {
	return (
		<nav className="space-y-8 py-[10vh]">
			{groups.map((group) => (
				<div key={group.title}>
					<p className="mb-3 text-neutral-400 text-sm pl-3 ">{group.title}</p>
					<ul className="space-y-1">
						{group.items.map((item) => (
							<li key={item.to}>
								<Link
									to={item.to}
									onClick={onNavigate}
									activeProps={{
										className:
											"bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50 self-start text-sm",
									}}
									className="block rounded-xl  hover:bg-neutral-100 dark:hover:bg-neutral-900 px-3 py-2 transition-colors duration-150 hover:text-neutral-900 dark:hover:text-neutral-50 self-start text-sm"
								>
									<p>{item.title}</p>
								</Link>
							</li>
						))}
					</ul>
				</div>
			))}
		</nav>
	);
}

function MobileDocsNavigation({
	groups,
	onNavigate,
}: {
	groups: ReturnType<typeof getDocsGroups>;
	onNavigate?: () => void;
}) {
	return (
		<nav className="space-y-10 pb-10">
			{groups.map((group) => (
				<div key={group.title}>
					<p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
						{group.title}
					</p>
					<ul className="space-y-1">
						{group.items.map((item) => (
							<li key={item.to}>
								<Link
									to={item.to}
									onClick={onNavigate}
									activeProps={{
										className: "text-neutral-950 dark:text-neutral-50",
									}}
									className="block py-2 text-2xl font-medium leading-none text-neutral-500 transition-colors duration-150 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50"
								>
									{item.title}
								</Link>
							</li>
						))}
					</ul>
				</div>
			))}
		</nav>
	);
}

function SearchResultIcon() {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 20 20"
			className="h-4.5 w-4.5"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M5.25 2.75h6.1l3.4 3.4v8.6a2 2 0 0 1-2 2h-7.5a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2Z" />
			<path d="M11.25 2.75v3.5h3.5" />
		</svg>
	);
}

function normalizeSearchValue(value: string) {
	return value.trim().toLowerCase();
}

function getSearchScore(doc: (typeof flatDocs)[number], terms: string[]) {
	const title = doc.title.toLowerCase();
	const pageTitle = doc.pageTitle.toLowerCase();
	const summary = doc.summary.toLowerCase();
	const description = doc.description.toLowerCase();
	const group = doc.group.toLowerCase();
	const path = doc.to.toLowerCase();
	const combined = `${title} ${pageTitle} ${summary} ${description} ${group} ${path}`;

	if (!terms.every((term) => combined.includes(term))) {
		return -1;
	}

	let score = 0;

	for (const term of terms) {
		if (title === term || pageTitle === term) {
			score += 120;
		} else if (title.startsWith(term) || pageTitle.startsWith(term)) {
			score += 80;
		} else if (title.includes(term) || pageTitle.includes(term)) {
			score += 56;
		}

		if (summary.includes(term)) {
			score += 18;
		}

		if (description.includes(term)) {
			score += 14;
		}

		if (group.includes(term)) {
			score += 10;
		}

		if (path.includes(term)) {
			score += 8;
		}
	}

	return score;
}

function SearchDialog({
	onClose,
	open,
	results,
	query,
	setQuery,
}: {
	onClose: () => void;
	open: boolean;
	query: string;
	results: ReadonlyArray<(typeof flatDocs)[number]>;
	setQuery: (value: string) => void;
}) {
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (!open) {
			return;
		}

		const frame = window.requestAnimationFrame(() => {
			inputRef.current?.focus();
			inputRef.current?.select();
		});

		return () => {
			window.cancelAnimationFrame(frame);
		};
	}, [open]);

	if (!open) {
		return null;
	}

	const hasQuery = normalizeSearchValue(query).length > 0;

	return (
		<div className="fixed inset-0 z-50">
			<button
				type="button"
				aria-label="Close search dialog"
				onClick={onClose}
				className="absolute inset-0 bg-black/15 backdrop-blur-[6px] dark:bg-black/40"
			/>
			<div className="pointer-events-none relative flex min-h-full items-center justify-center px-4 py-8 sm:px-6">
				<div
					role="dialog"
					aria-modal="true"
					aria-label="Search documentation"
					className="pointer-events-auto w-full max-w-2xl"
				>
					<div className="overflow-hidden rounded-4xl bg-neutral-100 shadow-[0_30px_120px_rgba(17,26,22,0.16)] backdrop-blur-xl dark:bg-neutral-900  dark:shadow-[0_30px_120px_rgba(0,0,0,0.48)]">
						<div className="flex items-center gap-3 px-5 py-4 sm:px-6">
							<div className="text-neutral-500 dark:text-neutral-400">
								<SearchIcon />
							</div>
							<input
								ref={inputRef}
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Search documentation..."
								className="min-w-0 flex-1 bg-transparent text-base text-neutral-950 outline-none placeholder:text-neutral-400 dark:text-neutral-50 dark:placeholder:text-neutral-500"
							/>
							<button
								type="button"
								onClick={onClose}
								className="shrink-0 rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] font-medium text-neutral-500 transition-colors duration-150 hover:bg-black/[0.08] hover:text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-400 dark:hover:bg-white/[0.09] dark:hover:text-neutral-200"
							>
								ESC
							</button>
						</div>

						{hasQuery && results.length > 0 ? (
							<div className="px-2">
								<div className="max-h-[min(52dvh,540px)] space-y-1 overflow-y-auto overscroll-contain scrollbar-none">
									{results.map((result, index) => (
										<Link
											key={result.to}
											to={result.to}
											onClick={onClose}
											className={`block rounded-3xl px-3 py-3 transition-colors duration-150 hover:bg-white dark:hover:bg-neutral-800 ${index === results.length - 1 ? " mb-2" : ""}`}
										>
											<div className="flex items-start gap-3">
												<div className="mt-0.5 text-neutral-400 dark:text-neutral-500">
													<SearchResultIcon />
												</div>
												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
														{result.title}
													</p>
													<p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
														{result.summary}
													</p>
													<p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
														{result.group} <span className="mx-1">›</span>{" "}
														{result.to}
													</p>
												</div>
											</div>
										</Link>
									))}
								</div>
							</div>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}

export function DocsShell({ children }: { children: ReactNode }) {
	const pathname =
		useRouterState({
			select: (state) => state.location.pathname,
		}) ?? "/";
	const currentDoc = findDoc(pathname);
	const currentVersion = getDocVersion(currentDoc.versionId);
	const groups = getDocsGroups(currentVersion.id);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const searchResults = useMemo(() => {
		const normalizedQuery = normalizeSearchValue(searchQuery);
		if (!normalizedQuery) {
			return [];
		}

		const terms = normalizedQuery.split(/\s+/).filter(Boolean);

		return flatDocs
			.filter((doc) => doc.versionId === currentVersion.id && !doc.hidden)
			.map((doc) => ({
				doc,
				score: getSearchScore(doc, terms),
			}))
			.filter((entry) => entry.score >= 0)
			.sort((left, right) => {
				if (left.score !== right.score) {
					return right.score - left.score;
				}

				return left.doc.order - right.doc.order;
			})
			.slice(0, 8)
			.map((entry) => entry.doc);
	}, [currentVersion.id, searchQuery]);

	useEffect(() => {
		void pathname;
		setMobileMenuOpen(false);
		setSearchOpen(false);
		setSearchQuery("");
	}, [pathname]);

	useEffect(() => {
		const previousOverflow = document.body.style.overflow;
		if (mobileMenuOpen || searchOpen) {
			document.body.style.overflow = "hidden";
		}
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [mobileMenuOpen, searchOpen]);

	useEffect(() => {
		if (!mobileMenuOpen && !searchOpen) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setMobileMenuOpen(false);
				setSearchOpen(false);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [mobileMenuOpen, searchOpen]);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setMobileMenuOpen(false);
				setSearchOpen(true);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	return (
		<div className="min-h-screen font-sans text-[#111a16] dark:text-[#eef4f1] max-w-360 mx-auto">
			<header className="sticky max-h-21 top-0 z-30 bg-white/92 text-neutral-950 backdrop-blur-xl dark:bg-neutral-950/95 dark:text-neutral-50 ">
				<div className="mx-auto flex py-4 w-full  items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
					<div className="flex min-w-0 items-center gap-4">
						<Link to="/" className="flex items-center justify-center">
							<LogoMark />
						</Link>
						<div className="min-w-0">
							<VersionDropdown
								value={currentVersion.id}
								currentSlug={currentDoc.slug}
							/>
						</div>
					</div>
					<div className="flex items-center gap-2 sm:gap-3">
						<HeaderSearch onClick={() => setSearchOpen(true)} />
						<div className="hidden items-center lg:flex">
							<HeaderMetric
								href="https://github.com/eds2002/react-native-screen-transitions"
								label="Open GitHub repository"
								value={githubStarsLabel}
							>
								<GithubIcon />
							</HeaderMetric>
						</div>
						<HeaderThemeToggle />
						<MenuButton
							open={mobileMenuOpen}
							onClick={() => setMobileMenuOpen((open) => !open)}
						/>
					</div>
				</div>
			</header>

			<SearchDialog
				open={searchOpen}
				query={searchQuery}
				results={searchResults}
				setQuery={setSearchQuery}
				onClose={() => {
					setSearchOpen(false);
					setSearchQuery("");
				}}
			/>

			{mobileMenuOpen ? (
				<div
					id="mobile-docs-dialog"
					role="dialog"
					aria-modal="true"
					aria-label="Documentation navigation"
					className="fixed inset-0 z-40 overflow-y-auto bg-white/98 backdrop-blur-xl dark:bg-neutral-950/98 lg:hidden"
				>
					<div className="min-h-full  ">
						<div className="mx-auto max-w-3xl ">
							<div className="flex items-center min-h-14 justify-between gap-4 sticky top-0 bg-white dark:bg-neutral-950 px-5 py-6 ">
								<div className="ml-auto items-center gap-4 justify-center">
									<button
										type="button"
										onClick={() => setMobileMenuOpen(false)}
										className="inline-flex justify-center items-center gap-3 text-neutral-950 transition-colors duration-150 hover:text-neutral-600 dark:text-neutral-50 dark:hover:text-neutral-300 self-end"
										aria-label="Close navigation dialog"
									>
										<span className="relative block h-4 w-4">
											<span className="absolute left-0 top-1/2 h-0.5 w-4 rotate-45 bg-current rounded-full" />
											<span className="absolute left-0 top-1/2 h-0.5 w-4 -rotate-45 bg-current rounded-full" />
										</span>
									</button>
								</div>
							</div>

							<div className="mt-12 px-5 pb-10 ">
								<MobileDocsNavigation
									key={currentVersion.id}
									groups={groups}
									onNavigate={() => setMobileMenuOpen(false)}
								/>
							</div>
						</div>
					</div>
				</div>
			) : null}

			<div className="mx-auto max-w-400 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[280px_minmax(0,1fr)_220px]">
				<aside className="hidden lg:sticky lg:top-21 lg:block lg:h-[calc(100dvh-84px)] lg:self-start lg:overflow-y-auto lg:overscroll-contain scrollbar-none">
					<div className="px-8">
						<DocsNavigation key={currentVersion.id} groups={groups} />
					</div>
				</aside>

				<main className="min-w-0 px-4 py-8 sm:px-6 lg:px-0 lg:py-10">
					<div className="mx-auto max-w-3xl">{children}</div>
				</main>

				<aside className="scrollbar-none hidden xl:sticky xl:top-21 xl:block xl:h-[calc(100dvh-84px)] xl:self-start xl:overflow-y-auto xl:overscroll-contain">
					<div className="px-8 py-10">
						<OnThisPage
							articleId={getDocArticleId(currentDoc.versionId, currentDoc.slug)}
						/>
					</div>
				</aside>
			</div>
		</div>
	);
}
