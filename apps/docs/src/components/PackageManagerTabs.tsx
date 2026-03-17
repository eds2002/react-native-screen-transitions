import React, { useCallback, useState } from "react";
import {
	type PackageManager,
	usePackageManager,
} from "../contexts/PackageManagerContext";

const MANAGERS: PackageManager[] = ["npm", "pnpm", "yarn", "bun"];

/**
 * Converts an npm install command to the equivalent for other package managers.
 */
function convertCommand(npmCommand: string, target: PackageManager): string {
	const trimmed = npmCommand.trim();

	if (target === "npm") return trimmed;

	if (trimmed.startsWith("npm install ")) {
		const packages = trimmed
			.replace("npm install ", "")
			.replace(/\\\n\s*/g, " ");
		switch (target) {
			case "pnpm":
				return `pnpm add ${packages}`;
			case "yarn":
				return `yarn add ${packages}`;
			case "bun":
				return `bun add ${packages}`;
		}
	}

	if (trimmed === "npm install") {
		switch (target) {
			case "pnpm":
				return "pnpm install";
			case "yarn":
				return "yarn";
			case "bun":
				return "bun install";
		}
	}

	if (trimmed.startsWith("npx ")) {
		const rest = trimmed.replace("npx ", "");
		switch (target) {
			case "pnpm":
				return `pnpm dlx ${rest}`;
			case "yarn":
				return `yarn dlx ${rest}`;
			case "bun":
				return `bunx --bun ${rest}`;
		}
	}

	return trimmed;
}

interface PackageManagerTabsProps {
	command: string;
}

export default function PackageManagerTabs({
	command,
}: PackageManagerTabsProps) {
	const { packageManager, setPackageManager } = usePackageManager();
	const [copied, setCopied] = useState(false);

	const currentCommand = convertCommand(command, packageManager);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(currentCommand);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard API not available
		}
	}, [currentCommand]);

	return (
		<div className="my-4 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
			<div className="flex items-center gap-1 px-3 py-2">
				{/* Terminal icon */}
				<div className="mr-1 flex items-center justify-center rounded-md border border-zinc-400 bg-white p-1 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
					<svg
						className="h-3.5 w-3.5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<title>Terminal</title>
						<polyline points="4 17 10 11 4 5" />
						<line x1="12" y1="19" x2="20" y2="19" />
					</svg>
				</div>

				{/* Tab buttons */}
				{MANAGERS.map((pm) => (
					<button
						key={pm}
						type="button"
						className={`rounded-md border-0 px-2.5 py-1 font-mono text-sm transition-colors cursor-pointer ${
							pm === packageManager
								? "bg-white font-semibold text-zinc-950  ring-0 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700"
								: "bg-transparent text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
						}`}
						onClick={() => setPackageManager(pm)}
					>
						{pm}
					</button>
				))}

				{/* Copy button */}
				<button
					type="button"
					className="ml-auto flex items-center rounded-lg border-0 bg-transparent p-1.5 text-zinc-400 transition-colors cursor-pointer hover:bg-zinc-200 hover:text-zinc-950 dark:hover:bg-zinc-700 dark:hover:text-zinc-50"
					onClick={handleCopy}
					title="Copy command"
				>
					{copied ? (
						<svg
							className="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<title>Copied</title>
							<polyline points="20 6 9 17 4 12" />
						</svg>
					) : (
						<svg
							className="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<title>Copy</title>
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
						</svg>
					)}
				</button>
			</div>

			{/* Command output */}
			<pre className="!m-0 !rounded-none !border-t !border-zinc-200 !bg-transparent !px-4 !py-3.5 font-mono !text-sm !leading-7 !text-zinc-950 dark:!border-zinc-700 dark:!text-zinc-50">
				{currentCommand}
			</pre>
		</div>
	);
}
