import { useEffect, useState } from "react";

const CODE_BLOCK_SYNC_EVENT = "screen-transitions-docs:code-block-sync";
const CODE_BLOCK_SYNC_STORAGE_PREFIX = "screen-transitions-docs:code-block:";

export type CodeBlockTab = {
	code: string;
	label: string;
	language?: string;
	value?: string;
};

export type CodeBlockProps = {
	code: string;
	defaultTab?: string;
	emphasisTokens?: ReadonlyArray<string>;
	highlightedLines?: ReadonlyArray<number>;
	label?: string;
	language?: string;
	showLineNumbers?: boolean;
	syncKey?: string;
	tabs?: ReadonlyArray<CodeBlockTab>;
	title?: string;
	variant?: "code" | "terminal";
};

type CodeSegment = {
	emphasized?: boolean;
	tone:
		| "comment"
		| "cssVar"
		| "keyword"
		| "plain"
		| "property"
		| "string"
		| "tag"
		| "value";
	value: string;
};

const BOOLEAN_LITERALS = new Set(["false", "null", "true", "undefined"]);
const TOKEN_REGEX =
	/("(?:[^"\\]|\\.)*"(?=\s*:))|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\/\/.*$)|(\b(?:import|from|export|const|let|var|function|return|type|interface|extends|implements|new|if|else|for|while|switch|case|break|continue|async|await|true|false|null|undefined)\b)|(<\/?[A-Za-z][A-Za-z0-9._:-]*)|(--[A-Za-z0-9-]+)|(\b\d+(?:\.\d+)?\b)/g;

function escapeRegex(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitByEmphasis(value: string, emphasisTokens: ReadonlyArray<string>) {
	if (!value || emphasisTokens.length === 0) {
		return [{ emphasized: false, value }];
	}

	const pattern = emphasisTokens
		.map((token) => token.trim())
		.filter(Boolean)
		.sort((left, right) => right.length - left.length)
		.map(escapeRegex)
		.join("|");

	if (!pattern) {
		return [{ emphasized: false, value }];
	}

	const matcher = new RegExp(`(${pattern})`, "g");
	const parts: Array<{ emphasized: boolean; value: string }> = [];
	let lastIndex = 0;

	for (const match of value.matchAll(matcher)) {
		const index = match.index ?? 0;
		if (index > lastIndex) {
			parts.push({
				emphasized: false,
				value: value.slice(lastIndex, index),
			});
		}

		parts.push({
			emphasized: true,
			value: match[0],
		});

		lastIndex = index + match[0].length;
	}

	if (lastIndex < value.length) {
		parts.push({
			emphasized: false,
			value: value.slice(lastIndex),
		});
	}

	return parts.length > 0 ? parts : [{ emphasized: false, value }];
}

function tokenizeLine(
	line: string,
	emphasisTokens: ReadonlyArray<string>,
): Array<CodeSegment> {
	const segments: Array<CodeSegment> = [];
	let lastIndex = 0;

	for (const match of line.matchAll(TOKEN_REGEX)) {
		const index = match.index ?? 0;
		if (index > lastIndex) {
			segments.push({
				tone: "plain",
				value: line.slice(lastIndex, index),
			});
		}

		const matchedValue = match[0];
		let tone: CodeSegment["tone"] = "plain";

		if (match[1]) {
			tone = "property";
		} else if (match[2]) {
			tone = "string";
		} else if (match[3]) {
			tone = "comment";
		} else if (match[4]) {
			tone = BOOLEAN_LITERALS.has(matchedValue) ? "value" : "keyword";
		} else if (match[5]) {
			tone = "tag";
		} else if (match[6]) {
			tone = "cssVar";
		} else if (match[7]) {
			tone = "value";
		}

		segments.push({
			tone,
			value: matchedValue,
		});

		lastIndex = index + matchedValue.length;
	}

	if (lastIndex < line.length) {
		segments.push({
			tone: "plain",
			value: line.slice(lastIndex),
		});
	}

	return segments.flatMap((segment) =>
		splitByEmphasis(segment.value, emphasisTokens).map((part) => ({
			...segment,
			emphasized: part.emphasized,
			value: part.value,
		})),
	);
}

function toneClass(tone: CodeSegment["tone"]) {
	switch (tone) {
		case "comment":
			return "text-[#7b8b84] dark:text-[#7f8e89]";
		case "cssVar":
			return "text-[#9a6700] dark:text-[#f2cc60]";
		case "keyword":
			return "text-[#cf222e] dark:text-[#ff7b72]";
		case "property":
			return "text-[#116329] dark:text-[#7ee787]";
		case "string":
			return "text-[#0550ae] dark:text-[#79c0ff]";
		case "tag":
			return "text-[#116329] dark:text-[#7ee787]";
		case "value":
			return "text-[#0550ae] dark:text-[#79c0ff]";
		default:
			return "text-[#111a16] dark:text-[#eef4f1]";
	}
}

function isTerminalLanguage(language?: string) {
	return language === "bash" || language === "shell" || language === "sh";
}

function getTabValue(tab: CodeBlockTab) {
	return tab.value ?? tab.label.toLowerCase();
}

function findTabIndex(
	tabs: ReadonlyArray<CodeBlockTab>,
	value?: string,
	defaultValue?: string,
) {
	const preferredValue = value ?? defaultValue;

	if (preferredValue) {
		const normalizedValue = preferredValue.toLowerCase();
		const matchedIndex = tabs.findIndex(
			(tab) =>
				getTabValue(tab).toLowerCase() === normalizedValue ||
				tab.label.toLowerCase() === normalizedValue,
		);

		if (matchedIndex >= 0) {
			return matchedIndex;
		}
	}

	return 0;
}

function CopyIcon() {
	return (
		<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
			<path
				d="M7.5 6.25V5a1.875 1.875 0 0 1 1.875-1.875h5a1.875 1.875 0 0 1 1.875 1.875v7.5a1.875 1.875 0 0 1-1.875 1.875h-1.25"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
			/>
			<path
				d="M5.625 6.25h5a1.875 1.875 0 0 1 1.875 1.875v6.875a1.875 1.875 0 0 1-1.875 1.875h-5A1.875 1.875 0 0 1 3.75 15V8.125A1.875 1.875 0 0 1 5.625 6.25Z"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
			/>
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
			<path
				d="m4.75 10.25 3.25 3.25 7.25-7.25"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.7"
			/>
		</svg>
	);
}

function TerminalIcon() {
	return (
		<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
			<path
				d="m5.5 6.5 2.75 2.75L5.5 12"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
			/>
			<path
				d="M10.75 12h3.75"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
			/>
			<rect
				x="2.75"
				y="3.25"
				width="14.5"
				height="13.5"
				rx="2.25"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
		</svg>
	);
}

function CopyButton({
	copied,
	onClick,
}: {
	copied: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={copied ? "Code copied" : "Copy code"}
			className={
				copied
					? "flex h-9 w-9 items-center justify-center rounded-md text-[#0fa184] transition-colors duration-150 dark:text-[#7df0d7]"
					: "flex h-9 w-9 items-center justify-center rounded-md text-[#5c6d66] transition-colors duration-150 hover:bg-black/[0.04] hover:text-[#111a16] dark:text-[#95a49f] dark:hover:bg-white/[0.06] dark:hover:text-[#eef4f1]"
			}
		>
			{copied ? <CheckIcon /> : <CopyIcon />}
		</button>
	);
}

export function CodeBlock({
	code,
	defaultTab,
	emphasisTokens = [],
	highlightedLines = [],
	label,
	language,
	showLineNumbers,
	syncKey,
	tabs,
	title,
	variant,
}: CodeBlockProps) {
	const initialTabIndex = tabs?.length
		? findTabIndex(tabs, undefined, defaultTab)
		: 0;
	const [activeTabIndex, setActiveTabIndex] = useState(initialTabIndex);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) {
			return;
		}

		const timeout = window.setTimeout(() => {
			setCopied(false);
		}, 1400);

		return () => window.clearTimeout(timeout);
	}, [copied]);

	useEffect(() => {
		if (tabs && activeTabIndex > tabs.length - 1) {
			setActiveTabIndex(0);
		}
	}, [activeTabIndex, tabs]);

	useEffect(() => {
		if (
			!syncKey ||
			!tabs ||
			tabs.length === 0 ||
			typeof window === "undefined"
		) {
			return;
		}

		const storageKey = `${CODE_BLOCK_SYNC_STORAGE_PREFIX}${syncKey}`;
		const storedValue = window.localStorage.getItem(storageKey);
		const nextIndex = findTabIndex(tabs, storedValue ?? undefined, defaultTab);
		setActiveTabIndex(nextIndex);
	}, [defaultTab, syncKey, tabs]);

	useEffect(() => {
		if (
			!syncKey ||
			!tabs ||
			tabs.length === 0 ||
			typeof window === "undefined"
		) {
			return;
		}

		const syncedTabs = tabs;

		function handleSync(event: Event) {
			const detail = (
				event as CustomEvent<{ syncKey?: string; value?: string }>
			).detail;
			if (!detail || detail.syncKey !== syncKey) {
				return;
			}

			const nextIndex = findTabIndex(syncedTabs, detail.value, defaultTab);
			setActiveTabIndex(nextIndex);
		}

		function handleStorage(event: StorageEvent) {
			if (
				event.key !== `${CODE_BLOCK_SYNC_STORAGE_PREFIX}${syncKey}` ||
				!event.newValue
			) {
				return;
			}

			const nextIndex = findTabIndex(syncedTabs, event.newValue, defaultTab);
			setActiveTabIndex(nextIndex);
		}

		window.addEventListener(CODE_BLOCK_SYNC_EVENT, handleSync);
		window.addEventListener("storage", handleStorage);

		return () => {
			window.removeEventListener(CODE_BLOCK_SYNC_EVENT, handleSync);
			window.removeEventListener("storage", handleStorage);
		};
	}, [defaultTab, syncKey, tabs]);

	useEffect(() => {
		if (
			!syncKey ||
			!tabs ||
			tabs.length === 0 ||
			typeof window === "undefined"
		) {
			return;
		}

		const activeTab = tabs[activeTabIndex];
		if (!activeTab) {
			return;
		}

		const storageKey = `${CODE_BLOCK_SYNC_STORAGE_PREFIX}${syncKey}`;
		const nextValue = getTabValue(activeTab);

		window.localStorage.setItem(storageKey, nextValue);
		window.dispatchEvent(
			new CustomEvent(CODE_BLOCK_SYNC_EVENT, {
				detail: {
					syncKey,
					value: nextValue,
				},
			}),
		);
	}, [activeTabIndex, syncKey, tabs]);

	const activeTab = tabs?.[activeTabIndex];
	const displayedCode = (activeTab?.code ?? code).replace(/\n$/, "");
	const resolvedLanguage = activeTab?.language ?? language;
	const resolvedVariant =
		variant ?? (tabs && tabs.length > 0 ? "terminal" : "code");
	const terminalBlock =
		resolvedVariant === "terminal" || isTerminalLanguage(resolvedLanguage);
	const resolvedTitle =
		title ??
		label ??
		(!terminalBlock && resolvedLanguage
			? resolvedLanguage.toUpperCase()
			: undefined);
	const withLineNumbers = showLineNumbers ?? !terminalBlock;
	const lines = displayedCode ? displayedCode.split("\n") : [""];
	const highlightedSet = new Set(highlightedLines);
	const hasHeader = Boolean((tabs && tabs.length > 0) || resolvedTitle);

	async function handleCopy() {
		if (typeof navigator === "undefined" || !navigator.clipboard) {
			return;
		}

		await navigator.clipboard.writeText(displayedCode);
		setCopied(true);
	}

	return (
		<div className="min-w-0 max-w-full overflow-hidden rounded-3xl bg-neutral-100/75 dark:bg-neutral-900">
			{tabs && tabs.length > 0 ? (
				<div className="flex items-center gap-3 border-b border-neutral-200/75 dark:border-neutral-800  px-3 py-2.5  ">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md  text-[#5c6d66] dark:text-[#95a49f]">
						<TerminalIcon />
					</div>
					<div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
						{tabs.map((tab, index) => {
							const active = index === activeTabIndex;

							return (
								<button
									key={tab.value ?? tab.label}
									type="button"
									onClick={() => setActiveTabIndex(index)}
									className={
										active
											? "rounded-lg bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm"
											: "rounded-lg px-3 py-1.5 transition-all text-neutral-600 dark:text-neutral-400  hover:dark:text-neutral-50 hover:dark:bg-neutral-800/50 hover:bg-white/50 hover:text-neutral-950 text-sm cursor-pointer"
									}
								>
									{tab.label}
								</button>
							);
						})}
					</div>
					<CopyButton copied={copied} onClick={() => void handleCopy()} />
				</div>
			) : resolvedTitle ? (
				<div className="flex items-center gap-3 border-b border-neutral-200/75  px-4 py-2 dark:border-white/8 ">
					<p className="min-w-0 flex-1 truncate text-[#111a16] dark:text-[#eef4f1]">
						{resolvedTitle}
					</p>
					<CopyButton copied={copied} onClick={() => void handleCopy()} />
				</div>
			) : (
				<div className="flex justify-end px-3 pt-3">
					<CopyButton copied={copied} onClick={() => void handleCopy()} />
				</div>
			)}
			<div className="scrollbar-none max-w-full overflow-x-auto overscroll-x-contain">
				<pre
					className={
						hasHeader
							? "min-w-full py-3 leading-7 text-[#111a16] dark:text-[#eef4f1]"
							: "min-w-full pb-4 leading-7 text-[#111a16] dark:text-[#eef4f1]"
					}
				>
					<code className="block min-w-full w-fit font-mono px-4 gap-12">
						{lines.map((line, index) => {
							const lineNumber = index + 1;
							const highlighted = highlightedSet.has(lineNumber);

							return (
								<div key={`${lineNumber}-${line}`} className={"relative pt-2"}>
									{highlighted ? (
										<span className="absolute inset-y-0 -inset-x-4 min-w-screen  bg-neutral-950/5 dark:bg-neutral-50/5" />
									) : null}
									<div
										className={
											withLineNumbers
												? "grid min-w-full grid-cols-[2rem_minmax(0,1fr)]"
												: "min-w-full"
										}
									>
										{withLineNumbers ? (
											<span className="select-none pt-0 text-left text-[#5c6d66] dark:text-[#95a49f] text-sm">
												{lineNumber}
											</span>
										) : null}
										<span className="min-w-0 whitespace-pre text-sm">
											{tokenizeLine(line, emphasisTokens).map(
												(segment, segmentIndex) => (
													<span
														key={`${lineNumber}-${segmentIndex.toString()}-${segment.value}`}
														className={
															segment.emphasized
																? `${toneClass(segment.tone)} rounded-[3px] bg-black/[0.08] px-1 text-[#111a16] dark:bg-white/[0.10] dark:text-[#eef4f1] text-sm`
																: `${toneClass(segment.tone)} text-sm`
														}
													>
														{segment.value}
													</span>
												),
											)}
										</span>
									</div>
								</div>
							);
						})}
					</code>
				</pre>
			</div>
		</div>
	);
}
