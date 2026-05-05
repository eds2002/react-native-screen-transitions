#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const packageDir =
	process.env.PACKAGE_DIR ?? "packages/react-native-screen-transitions";
const channel = readRequiredEnv("PRERELEASE_CHANNEL");
const bump = process.env.PRERELEASE_BUMP ?? "patch";

const allowedChannels = new Set(["alpha", "beta", "rc"]);
const allowedBumps = new Set(["patch", "minor", "major"]);

if (!allowedChannels.has(channel)) {
	throw new Error(
		`Unsupported prerelease channel "${channel}". Expected alpha, beta, or rc.`,
	);
}

if (!allowedBumps.has(bump)) {
	throw new Error(
		`Unsupported prerelease bump "${bump}". Expected patch, minor, or major.`,
	);
}

const packageJsonPath = resolve(process.cwd(), packageDir, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const stableVersion = parseStableVersion(packageJson.version);
const baseVersion = bumpVersion(stableVersion, bump);
const publishedVersions = readPublishedVersions(packageJson.name);
const prefix = `${baseVersion.major}.${baseVersion.minor}.${baseVersion.patch}-${channel}.`;
const nextPrerelease = nextPrereleaseNumber(publishedVersions, prefix);
const version = `${prefix}${nextPrerelease}`;

writeOutput("version", version);
writeOutput("tag", `v${version}`);
writeOutput("npm_tag", channel);

console.log(
	JSON.stringify(
		{
			package: packageJson.name,
			currentVersion: packageJson.version,
			bump,
			channel,
			version,
			npmTag: channel,
		},
		null,
		2,
	),
);

function readRequiredEnv(name) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing required environment variable ${name}.`);
	}

	return value;
}

function parseStableVersion(version) {
	const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);

	if (!match) {
		throw new Error(
			`Expected package.json version to be stable x.y.z, received "${version}".`,
		);
	}

	return {
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3]),
	};
}

function bumpVersion(version, bumpType) {
	if (bumpType === "major") {
		return { major: version.major + 1, minor: 0, patch: 0 };
	}

	if (bumpType === "minor") {
		return { major: version.major, minor: version.minor + 1, patch: 0 };
	}

	return {
		major: version.major,
		minor: version.minor,
		patch: version.patch + 1,
	};
}

function readPublishedVersions(packageName) {
	try {
		const output = execFileSync(
			"npm",
			["view", packageName, "versions", "--json"],
			{
				encoding: "utf8",
				stdio: ["ignore", "pipe", "pipe"],
			},
		);

		const parsed = JSON.parse(output);

		if (Array.isArray(parsed)) {
			return parsed;
		}

		return parsed ? [parsed] : [];
	} catch (error) {
		const stderr = String(error.stderr ?? "");

		if (stderr.includes("E404")) {
			return [];
		}

		throw error;
	}
}

function nextPrereleaseNumber(versions, prefix) {
	let max = -1;

	for (const version of versions) {
		if (!version.startsWith(prefix)) {
			continue;
		}

		const prereleaseNumber = Number(version.slice(prefix.length));

		if (Number.isInteger(prereleaseNumber) && prereleaseNumber > max) {
			max = prereleaseNumber;
		}
	}

	return max + 1;
}

function writeOutput(name, value) {
	const outputPath = process.env.GITHUB_OUTPUT;

	if (!outputPath) {
		return;
	}

	appendFileSync(outputPath, `${name}=${value}\n`);
}
