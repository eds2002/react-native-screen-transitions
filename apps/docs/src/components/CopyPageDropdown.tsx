import React, { useCallback, useEffect, useRef, useState } from "react";

function getPageMarkdown(): string {
	const article = document.querySelector(".theme-doc-markdown");
	if (!article) return "";

	// Simple HTML to markdown conversion
	const clone = article.cloneNode(true) as HTMLElement;

	// Remove unwanted elements
	Array.from(clone.querySelectorAll("button, .hash-link")).forEach((el) => {
		el.remove();
	});

	function nodeToMarkdown(node: Node, depth = 0): string {
		if (node.nodeType === Node.TEXT_NODE) {
			return node.textContent || "";
		}

		if (node.nodeType !== Node.ELEMENT_NODE) return "";

		const el = node as HTMLElement;
		const tag = el.tagName.toLowerCase();
		const childMd = Array.from(el.childNodes)
			.map((c) => nodeToMarkdown(c, depth))
			.join("");

		switch (tag) {
			case "h1":
				return `# ${childMd.trim()}\n\n`;
			case "h2":
				return `## ${childMd.trim()}\n\n`;
			case "h3":
				return `### ${childMd.trim()}\n\n`;
			case "h4":
				return `#### ${childMd.trim()}\n\n`;
			case "p":
				return `${childMd.trim()}\n\n`;
			case "strong":
			case "b":
				return `**${childMd}**`;
			case "em":
			case "i":
				return `*${childMd}*`;
			case "code":
				if (el.parentElement?.tagName.toLowerCase() === "pre") {
					return childMd;
				}
				return `\`${childMd}\``;
			case "pre": {
				const codeEl = el.querySelector("code");
				const lang = codeEl?.className.match(/language-(\w+)/)?.[1] || "";
				const codeText = codeEl?.textContent || childMd;
				return `\`\`\`${lang}\n${codeText.trim()}\n\`\`\`\n\n`;
			}
			case "a":
				return `[${childMd}](${el.getAttribute("href") || ""})`;
			case "ul":
				return `${childMd}\n`;
			case "ol":
				return `${childMd}\n`;
			case "li": {
				const parent = el.parentElement?.tagName.toLowerCase();
				const items = el.parentElement
					? Array.from(el.parentElement.children)
					: [];
				const index = items.indexOf(el);
				const prefix = parent === "ol" ? `${index + 1}. ` : "- ";
				return `${prefix}${childMd.trim()}\n`;
			}
			case "blockquote":
				return (
					childMd
						.split("\n")
						.map((line) => `> ${line}`)
						.join("\n") + "\n\n"
				);
			case "hr":
				return "---\n\n";
			case "br":
				return "\n";
			case "table":
			case "thead":
			case "tbody":
			case "tr":
			case "th":
			case "td":
			case "div":
			case "section":
			case "article":
			case "header":
			case "nav":
			case "span":
				return childMd;
			default:
				return childMd;
		}
	}

	return nodeToMarkdown(clone).trim();
}

export default function CopyPageDropdown() {
	const [isOpen, setIsOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close on outside click
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Close on Escape
	useEffect(() => {
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") setIsOpen(false);
		}
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, []);

	const handleCopyMarkdown = useCallback(async () => {
		const md = getPageMarkdown();
		try {
			await navigator.clipboard.writeText(md);
			setCopied(true);
			setTimeout(() => {
				setCopied(false);
				setIsOpen(false);
			}, 1500);
		} catch {
			// Clipboard not available
		}
	}, []);

	const handleOpenInChatGPT = useCallback(() => {
		const md = getPageMarkdown();
		const encoded = encodeURIComponent(md);
		window.open(`https://chat.openai.com/?q=${encoded}`, "_blank");
		setIsOpen(false);
	}, []);

	const handleOpenInClaude = useCallback(() => {
		const md = getPageMarkdown();
		const encoded = encodeURIComponent(md);
		window.open(`https://claude.ai/new?q=${encoded}`, "_blank");
		setIsOpen(false);
	}, []);

	return (
		<div className="copy-page-wrapper" ref={dropdownRef}>
			<button
				type="button"
				className="copy-page-button"
				onClick={handleCopyMarkdown}
				title="Copy page as markdown"
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
					<title>Copy</title>
					<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
					<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
				</svg>
				{copied ? "Copied!" : "Copy Page"}
			</button>
			<button
				type="button"
				className="copy-page-chevron"
				onClick={() => setIsOpen(!isOpen)}
				aria-label="More options"
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
					<title>Expand</title>
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</button>

			{isOpen && (
				<div className="copy-page-dropdown">
					<button
						type="button"
						className="copy-page-dropdown-item"
						onClick={handleCopyMarkdown}
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
							<title>Copy as Markdown</title>
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
						</svg>
						Copy as Markdown
					</button>
					<button
						type="button"
						className="copy-page-dropdown-item"
						onClick={handleOpenInChatGPT}
					>
						<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<title>ChatGPT</title>
							<path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.615 1.5v3.004l-2.6 1.5-2.617-1.5z" />
						</svg>
						Open in ChatGPT
					</button>
					<button
						type="button"
						className="copy-page-dropdown-item"
						onClick={handleOpenInClaude}
					>
						<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<title>Claude</title>
							<path d="M4.709 15.955l4.397-2.293-.023-4.884L4.64 6.528l-.124 4.96zm7.065-10.636l4.377 2.334 4.325-2.39L16.15 3.05c-.902-.5-1.35-.75-1.826-.847a3.03 3.03 0 0 0-1.198 0c-.476.098-.924.348-1.826.847zm9.498 3.378l-4.44 2.449.044 4.834 4.423 2.293.097-4.804c.054-1.032.08-1.548-.035-2.017a3.03 3.03 0 0 0-.58-1.045c-.313-.368-.762-.618-1.509-1.11zM4.354 15.783l.097 4.804c.054 1.032.08 1.548.295 1.997.19.397.474.743.827 1.01.4.301.928.5 1.827.848L11.725 22.2l-4.377-2.334zm7.42 6.424l4.326 2.243c.899.466 1.348.7 1.826.797.423.087.86.087 1.283 0 .478-.098.927-.331 1.826-.797l.374-.194-4.397 2.293.023-4.884zM4.56 6.357l4.397-2.293 4.374 2.211-4.396 2.293z" />
						</svg>
						Open in Claude
					</button>
				</div>
			)}
		</div>
	);
}
