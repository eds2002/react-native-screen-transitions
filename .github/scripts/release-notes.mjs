#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const version = process.argv[2];
const checkOnly = process.argv.includes("--check");

if (!version) {
	console.error("Usage: release-notes.mjs <version> [--check]");
	process.exit(1);
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const changelogPath = resolve(
	repoRoot,
	"packages/react-native-screen-transitions/CHANGELOG.md",
);
const changelog = readFileSync(changelogPath, "utf8");
const section = findReleaseSection(changelog, version);

if (!section) {
	if (version.includes("-")) {
		if (!checkOnly) {
			console.log(`Prerelease ${version}`);
		}

		process.exit(0);
	}

	console.error(
		`Missing CHANGELOG.md section for ${version}. Add a "## [${version}]" section before publishing a stable release.`,
	);
	process.exit(1);
}

if (!checkOnly) {
	console.log(section);
}

function findReleaseSection(markdown, releaseVersion) {
	const headerPattern = new RegExp(
		`^#{1,3}\\s+\\[?${escapeRegExp(releaseVersion)}\\]?(?:\\(|\\s|$)`,
		"m",
	);
	const header = headerPattern.exec(markdown);

	if (!header) {
		return null;
	}

	const sectionStart = header.index;
	const afterHeaderStart = sectionStart + header[0].length;
	const nextHeader = /\n#{1,3}\s+\[?\d+\.\d+\.\d+(?:[-A-Za-z0-9.]+)?\]?/.exec(
		markdown.slice(afterHeaderStart),
	);
	const sectionEnd = nextHeader
		? afterHeaderStart + nextHeader.index
		: markdown.length;

	return markdown.slice(sectionStart, sectionEnd).trim();
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
