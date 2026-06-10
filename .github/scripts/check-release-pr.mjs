#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageJsonPath =
	process.env.PACKAGE_JSON_PATH ??
	"packages/react-native-screen-transitions/package.json";
const baseRef = process.env.BASE_REF;

if (!baseRef) {
	console.error("BASE_REF is required.");
	process.exit(1);
}

const currentPackage = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const currentVersion = currentPackage.version;
const packageName = currentPackage.name;
const baseVersion = readVersionAtRef(baseRef, packageJsonPath);

if (!baseVersion) {
	console.error(`Could not read ${packageJsonPath} at ${baseRef}.`);
	process.exit(1);
}

if (baseVersion === currentVersion) {
	console.log(
		`Skipping release validation because version stayed at ${currentVersion}.`,
	);
	process.exit(0);
}

if (currentVersion.includes("-")) {
	console.log(
		`Skipping stable release validation for prerelease ${currentVersion}.`,
	);
	process.exit(0);
}

if (compareVersions(currentVersion, baseVersion) <= 0) {
	console.log(
		`Skipping release validation because version moved from ${baseVersion} to ${currentVersion}.`,
	);
	process.exit(0);
}

const tagName = `v${currentVersion}`;

if (remoteTagExists(tagName)) {
	console.error(`Git tag ${tagName} already exists.`);
	process.exit(1);
}

if (npmVersionExists(packageName, currentVersion)) {
	console.error(
		`${packageName}@${currentVersion} is already published to npm.`,
	);
	process.exit(1);
}

checkReleaseNotes(currentVersion);

console.log(
	`Stable release validation passed for ${packageName}@${currentVersion}.`,
);

function readVersionAtRef(ref, path) {
	try {
		const output = execFileSync("git", ["show", `${ref}:${path}`], {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		});

		return JSON.parse(output).version;
	} catch {
		return null;
	}
}

function remoteTagExists(tagName) {
	try {
		execFileSync(
			"git",
			["ls-remote", "--exit-code", "--tags", "origin", `refs/tags/${tagName}`],
			{
				stdio: "ignore",
			},
		);
		return true;
	} catch {
		return false;
	}
}

function npmVersionExists(name, version) {
	try {
		execFileSync("npm", ["view", `${name}@${version}`, "version", "--json"], {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		});
		return true;
	} catch (error) {
		const stderr = String(error.stderr ?? "");

		if (stderr.includes("E404")) {
			return false;
		}

		throw error;
	}
}

function checkReleaseNotes(version) {
	const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

	execFileSync(
		"node",
		[
			resolve(repoRoot, ".github/scripts/release-notes.mjs"),
			version,
			"--check",
		],
		{ stdio: "inherit" },
	);
}

function compareVersions(left, right) {
	const leftVersion = parseVersion(left);
	const rightVersion = parseVersion(right);

	for (let index = 0; index < leftVersion.parts.length; index += 1) {
		if (leftVersion.parts[index] !== rightVersion.parts[index]) {
			return leftVersion.parts[index] - rightVersion.parts[index];
		}
	}

	if (leftVersion.prerelease === rightVersion.prerelease) {
		return 0;
	}

	if (leftVersion.prerelease) {
		return -1;
	}

	if (rightVersion.prerelease) {
		return 1;
	}

	return 0;
}

function parseVersion(version) {
	const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(version);

	if (!match) {
		console.error(`Expected a semver version, received ${version}.`);
		process.exit(1);
	}

	return {
		parts: match.slice(1, 4).map(Number),
		prerelease: match[4] ?? null,
	};
}
