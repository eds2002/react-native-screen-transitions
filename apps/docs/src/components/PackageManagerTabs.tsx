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

	// Handle "npm install <packages>"
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

	// Handle plain "npm install"
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

	// Handle "npx <command>"
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
	/** The npm command to display (e.g. "npm install react-native-screen-transitions") */
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
		<div className="pm-tabs-container">
			<div className="pm-tabs-header">
				<div className="pm-tabs-icon" aria-hidden="true">
					<svg
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
				{MANAGERS.map((pm) => (
					<button
						key={pm}
						type="button"
						className="pm-tab-button"
						data-active={pm === packageManager}
						onClick={() => setPackageManager(pm)}
					>
						{pm}
					</button>
				))}
				<button
					type="button"
					className="pm-tabs-copy"
					onClick={handleCopy}
					title="Copy command"
				>
					{copied ? (
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<title>Copied</title>
							<polyline points="20 6 9 17 4 12" />
						</svg>
					) : (
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
					)}
				</button>
			</div>
			<pre className="pm-tabs-code">{currentCommand}</pre>
		</div>
	);
}
