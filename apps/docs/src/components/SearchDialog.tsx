import { useHistory } from "@docusaurus/router";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface DocPage {
	title: string;
	path: string;
	section: string;
}

// Static list of all doc pages for search
const DOC_PAGES: DocPage[] = [
	{ title: "Docs Overview", path: "/docs/intro", section: "Getting Started" },
	{
		title: "Installation",
		path: "/docs/getting-started/installation",
		section: "Getting Started",
	},
	{
		title: "Quickstart",
		path: "/docs/getting-started/quickstart",
		section: "Getting Started",
	},
	{
		title: "Choosing a Stack",
		path: "/docs/stack-variants",
		section: "Getting Started",
	},
	{
		title: "Mental Model",
		path: "/docs/core-mental-model",
		section: "Getting Started",
	},
	{ title: "Presets", path: "/docs/presets", section: "Building Transitions" },
	{
		title: "Custom Transitions",
		path: "/docs/custom-transitions",
		section: "Building Transitions",
	},
	{
		title: "Shared Elements and Navigation Zoom",
		path: "/docs/shared-elements-bounds",
		section: "Building Transitions",
	},
	{
		title: "Sheets, Drawers, and Gestures",
		path: "/docs/gestures-snap-points",
		section: "Building Transitions",
	},
	{
		title: "Hooks and Coordination",
		path: "/docs/hooks-and-coordination",
		section: "Building Transitions",
	},
	{ title: "Common Recipes", path: "/docs/recipes", section: "Patterns" },
	{ title: "Performance Notes", path: "/docs/performance", section: "Patterns" },
	{ title: "Upgrading to 3.4", path: "/docs/migration", section: "Patterns" },
	{ title: "Release Notes", path: "/docs/release-notes", section: "Release" },
	{
		title: "3.4",
		path: "/docs/release-notes/3-4",
		section: "Release",
	},
	{ title: "API Reference", path: "/docs/api", section: "API" },
];

export default function SearchDialog() {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const history = useHistory();
	const { siteConfig } = useDocusaurusContext();
	const baseUrl = siteConfig.baseUrl.replace(/\/$/, "");

	const results = useMemo(() => {
		if (!query.trim()) return DOC_PAGES;
		const lower = query.toLowerCase();
		return DOC_PAGES.filter(
			(page) =>
				page.title.toLowerCase().includes(lower) ||
				page.section.toLowerCase().includes(lower) ||
				page.path.toLowerCase().includes(lower),
		);
	}, [query]);

	// Reset selection when query changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on query change
	useEffect(() => {
		setSelectedIndex(0);
	}, [query]);

	// Keyboard shortcut to open
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setIsOpen(true);
			}
		}
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Focus input when opened
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 50);
		} else {
			setQuery("");
			setSelectedIndex(0);
		}
	}, [isOpen]);

	const navigateTo = useCallback(
		(path: string) => {
			history.push(`${baseUrl}${path}`);
			setIsOpen(false);
		},
		[history, baseUrl],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((i) => Math.max(i - 1, 0));
					break;
				case "Enter":
					e.preventDefault();
					if (results[selectedIndex]) {
						navigateTo(results[selectedIndex].path);
					}
					break;
				case "Escape":
					e.preventDefault();
					setIsOpen(false);
					break;
			}
		},
		[results, selectedIndex, navigateTo],
	);

	return (
		<>
			<button
				type="button"
				className="search-trigger"
				onClick={() => setIsOpen(true)}
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<title>Search</title>
					<circle cx="11" cy="11" r="8" />
					<line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
				<span className="search-trigger-text">Search documentation...</span>
				<kbd className="search-trigger-shortcut">⌘K</kbd>
			</button>

			{isOpen && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: overlay dismissal
				// biome-ignore lint/a11y/noStaticElementInteractions: overlay dismissal
				<div
					className="search-overlay"
					onClick={(e) => {
						if (e.target === e.currentTarget) setIsOpen(false);
					}}
					role="presentation"
				>
					<div
						className="search-dialog"
						role="dialog"
						aria-label="Search documentation"
					>
						<div className="search-input-wrapper">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<title>Search</title>
								<circle cx="11" cy="11" r="8" />
								<line x1="21" y1="21" x2="16.65" y2="16.65" />
							</svg>
							<input
								ref={inputRef}
								className="search-input"
								type="text"
								placeholder="Search documentation..."
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={handleKeyDown}
							/>
						</div>

						<div className="search-results">
							{results.length === 0 ? (
								<div className="search-empty">
									No results found for &quot;{query}&quot;
								</div>
							) : (
								results.map((page, index) => (
									<button
										key={page.path}
										type="button"
										className="search-result-item"
										data-selected={index === selectedIndex}
										style={{
											background:
												index === selectedIndex
													? "var(--color-muted)"
													: undefined,
										}}
										onClick={() => navigateTo(page.path)}
										onMouseEnter={() => setSelectedIndex(index)}
									>
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
											aria-hidden="true"
										>
											<title>Document</title>
											<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
											<polyline points="14 2 14 8 20 8" />
										</svg>
										<div>
											<div className="search-result-title">{page.title}</div>
											<div className="search-result-path">{page.section}</div>
										</div>
									</button>
								))
							)}
						</div>

						<div className="search-footer">
							<span>
								<kbd>↑</kbd> <kbd>↓</kbd> navigate
							</span>
							<span>
								<kbd>↵</kbd> open
							</span>
							<span>
								<kbd>esc</kbd> close
							</span>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
