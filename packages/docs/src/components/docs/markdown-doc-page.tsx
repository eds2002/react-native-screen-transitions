import { Link } from "@tanstack/react-router";
import {
	Children,
	type ComponentPropsWithoutRef,
	isValidElement,
	type ReactNode,
} from "react";
import {
	createDocHead,
	type DocSlug,
	type DocVersionId,
	getAdjacentDocs,
	getDocArticleId,
	getDocByVersionAndSlug,
} from "../../lib/docs";
import { flattenReactText } from "../../utils/headings";
import { BulletList } from "../ui/bullet-list";
import { CodeBlock } from "../ui/code-block";
import { InfoGrid } from "../ui/info-grid";
import { Note } from "../ui/note";
import { PageIntro } from "../ui/page-intro";
import { PageLinks } from "../ui/page-links";
import { Section } from "../ui/section";
import { Step } from "../ui/step";
import { Steps } from "../ui/steps";
import { ThemeToggle } from "../ui/theme-toggle";
import { VideoEmbed } from "../ui/video-embed";
import { DocHeading } from "./doc-heading";

function MarkdownAnchor({
	href,
	children,
}: {
	href?: string;
	children: React.ReactNode;
}) {
	if (!href) {
		return <span>{children}</span>;
	}

	if (href.startsWith("#")) {
		return (
			<a
				href={href}
				className="font-medium text-[#0fa184] underline decoration-[#0fa184]/45 underline-offset-4 transition-colors duration-150 hover:text-[#111a16] dark:text-[#7df0d7] dark:decoration-[#7df0d7]/45 dark:hover:text-[#eef4f1]"
			>
				{children}
			</a>
		);
	}

	if (href.startsWith("/")) {
		return (
			<Link
				to={href}
				className="font-medium text-[#0fa184] underline decoration-[#0fa184]/45 underline-offset-4 transition-colors duration-150 hover:text-[#111a16] dark:text-[#7df0d7] dark:decoration-[#7df0d7]/45 dark:hover:text-[#eef4f1]"
			>
				{children}
			</Link>
		);
	}

	return (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className="font-medium text-[#0fa184] underline decoration-[#0fa184]/45 underline-offset-4 transition-colors duration-150 hover:text-[#111a16] dark:text-[#7df0d7] dark:decoration-[#7df0d7]/45 dark:hover:text-[#eef4f1]"
		>
			{children}
		</a>
	);
}

function parseLineNumbers(spec?: string) {
	if (!spec) {
		return undefined;
	}

	const lines = new Set<number>();

	for (const part of spec.split(",")) {
		const value = part.trim();
		if (!value) {
			continue;
		}

		const [startText, endText] = value.split("-");
		const start = Number(startText);

		if (!Number.isInteger(start) || start < 1) {
			continue;
		}

		if (!endText) {
			lines.add(start);
			continue;
		}

		const end = Number(endText);
		if (!Number.isInteger(end) || end < start) {
			continue;
		}

		for (let line = start; line <= end; line += 1) {
			lines.add(line);
		}
	}

	return lines.size > 0
		? Array.from(lines).sort((left, right) => left - right)
		: undefined;
}

function parseCodeMeta(meta?: string) {
	if (!meta) {
		return {
			emphasisTokens: undefined,
			highlightedLines: undefined,
			title: undefined,
		};
	}

	const title = /title="([^"]+)"/.exec(meta)?.[1];
	const lineSpec =
		/highlight="([\d,-]+)"/.exec(meta)?.[1] ?? /\{([\d,-]+)\}/.exec(meta)?.[1];
	const tokensSpec = /(?:tokens|focus|emphasis)="([^"]+)"/.exec(meta)?.[1];
	const emphasisTokens = tokensSpec
		?.split(",")
		.map((token) => token.trim())
		.filter(Boolean);

	return {
		emphasisTokens:
			emphasisTokens && emphasisTokens.length > 0 ? emphasisTokens : undefined,
		highlightedLines: parseLineNumbers(lineSpec),
		title,
	};
}

function parseTokenList(source?: string) {
	const emphasisTokens = source
		?.split(",")
		.map((token) => token.trim())
		.filter(Boolean);

	return emphasisTokens && emphasisTokens.length > 0
		? emphasisTokens
		: undefined;
}

function isTerminalLanguage(language?: string) {
	return language === "bash" || language === "shell" || language === "sh";
}

function InlineCode({ children, ...props }: ComponentPropsWithoutRef<"code">) {
	return (
		<code
			{...props}
			className="rounded-[4px] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[0.95em] text-[#111a16] dark:bg-white/[0.06] dark:text-[#eef4f1]"
		>
			{children}
		</code>
	);
}

function PreformattedCode({ children }: { children?: ReactNode }) {
	const [child] = Children.toArray(children);

	if (
		!isValidElement<{
			children?: ReactNode;
			className?: string;
			emphasis?: string;
			focus?: string;
			highlight?: string;
			metastring?: string;
			title?: string;
			tokens?: string;
		}>(child)
	) {
		return <pre>{children}</pre>;
	}

	const value = flattenReactText(child.props.children).replace(/\n$/, "");
	const language = /language-([\w-]+)/.exec(child.props.className ?? "")?.[1];
	const parsedMeta = parseCodeMeta(child.props.metastring);
	const directEmphasis =
		parseTokenList(child.props.tokens) ??
		parseTokenList(child.props.focus) ??
		parseTokenList(child.props.emphasis);
	const terminalBlock = isTerminalLanguage(language);

	return (
		<CodeBlock
			code={value}
			emphasisTokens={directEmphasis ?? parsedMeta.emphasisTokens}
			highlightedLines={
				parseLineNumbers(child.props.highlight) ?? parsedMeta.highlightedLines
			}
			language={language}
			showLineNumbers={!terminalBlock}
			title={
				child.props.title ??
				parsedMeta.title ??
				(!terminalBlock && language ? language.toUpperCase() : undefined)
			}
			variant={terminalBlock ? "terminal" : "code"}
		/>
	);
}

const mdxComponents = {
	a: MarkdownAnchor,
	blockquote: ({ children }: { children?: ReactNode }) => (
		<blockquote className="max-w-184  rounded-3xl bg-neutral-100 p-5  text-neutral-950  dark:bg-neutral-900 dark:text-neutral-50">
			{children}
		</blockquote>
	),
	code: InlineCode,
	pre: PreformattedCode,
	h2: ({ children }: { children?: ReactNode }) => (
		<DocHeading
			as="h2"
			className="scroll-mt-28 text-xl font-medium text-neutral-950 dark:text-neutral-50"
		>
			{children}
		</DocHeading>
	),
	h3: ({ children }: { children?: ReactNode }) => (
		<DocHeading
			as="h3"
			className="scroll-mt-28 text-lg font-medium text-neutral-950 dark:text-neutral-50"
		>
			{children}
		</DocHeading>
	),
	hr: () => (
		<hr className="my-8 border-0 border-t border-black/10 dark:border-white/14" />
	),
	img: ({ src, alt }: { src?: string; alt?: string }) => (
		<img
			src={src ?? ""}
			alt={alt ?? ""}
			loading="lazy"
			className="mt-6 rounded-md border border-black/10 object-cover shadow-[0_24px_80px_rgba(17,26,22,0.08)] dark:border-white/14 dark:shadow-[0_24px_80px_rgba(0,0,0,0.34)]"
		/>
	),
	li: ({ children }: { children?: ReactNode }) => (
		<li className="mt-2 first:mt-0">{children}</li>
	),
	ol: ({ children }: { children?: ReactNode }) => (
		<ol className="max-w-[46rem] list-decimal pl-[1.4rem] text-neutral-600 dark:text-neutral-400">
			{children}
		</ol>
	),
	p: ({ children }: { children?: ReactNode }) => (
		<p className="max-w-[46rem] text-neutral-600 dark:text-neutral-400">
			{children}
		</p>
	),
	strong: ({ children }: { children?: ReactNode }) => (
		<strong className="font-medium text-[#111a16] dark:text-[#eef4f1]">
			{children}
		</strong>
	),
	table: ({ children }: { children?: ReactNode }) => (
		<div className="max-w-[46rem] overflow-x-auto">
			<table className="w-full border-collapse text-left">{children}</table>
		</div>
	),
	td: ({ children }: { children?: ReactNode }) => (
		<td className="px-4 py-[0.85rem] whitespace-nowrap text-neutral-600 dark:text-neutral-400">
			{children}
		</td>
	),
	th: ({ children }: { children?: ReactNode }) => (
		<th className="border-b border-black/10 px-4 py-[0.85rem] whitespace-nowrap text-[0.92rem] font-semibold text-[#111a16] dark:border-white/14 dark:text-[#eef4f1]">
			{children}
		</th>
	),
	ul: ({ children }: { children?: ReactNode }) => (
		<ul className="max-w-[46rem] list-disc pl-[1.4rem] text-[1.05rem] leading-[1.8] text-neutral-600 dark:text-neutral-400">
			{children}
		</ul>
	),
	BulletList,
	CodeBlock,
	InfoGrid,
	Note,
	PageLinks,
	Section,
	Step,
	Steps,
	ThemeToggle,
	VideoEmbed,
};

function MarkdownBody({
	versionId,
	slug,
}: {
	versionId: DocVersionId;
	slug: DocSlug;
}) {
	const doc = getDocByVersionAndSlug(versionId, slug);
	const adjacentDocs = getAdjacentDocs(versionId, slug);
	const Content = doc.Content;
	const articleId = getDocArticleId(versionId, slug);
	const pageLinks = [
		adjacentDocs.previous
			? {
					copy: adjacentDocs.previous.summary,
					direction: "previous" as const,
					eyebrow: "Previous",
					title: adjacentDocs.previous.title,
					to: adjacentDocs.previous.to,
				}
			: null,
		adjacentDocs.next
			? {
					copy: adjacentDocs.next.summary,
					direction: "next" as const,
					eyebrow: "Next",
					title: adjacentDocs.next.title,
					to: adjacentDocs.next.to,
				}
			: null,
	].filter((item) => item !== null);

	return (
		<>
			<PageIntro
				availability={doc.availability}
				eyebrow={doc.eyebrow}
				title={doc.pageTitle}
				lede={doc.description}
			/>
			<article
				id={articleId}
				className="docs-markdown mt-10 min-w-0 [&>*+*]:mt-3 sm:[&>*+*]:mt-4 [&>[data-doc-heading='true']]:mt-12 sm:[&>[data-doc-heading='true']]:mt-14 [&>[data-doc-heading='true']:first-child]:mt-0 [&>[data-doc-heading='true']+*]:mt-3 sm:[&>[data-doc-heading='true']+*]:mt-4"
			>
				<Content components={mdxComponents} />
			</article>
			{pageLinks.length > 0 ? (
				<div className="mt-14">
					<PageLinks items={pageLinks} />
				</div>
			) : null}
		</>
	);
}

export function createDocRouteConfig(versionId: DocVersionId, slug: DocSlug) {
	const doc = getDocByVersionAndSlug(versionId, slug);

	return {
		head: () => createDocHead(doc),
		component: function DocRouteComponent() {
			return <MarkdownBody versionId={versionId} slug={slug} />;
		},
	};
}
