#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";

const packageJsonPath =
	process.env.PACKAGE_JSON_PATH ??
	"packages/react-native-screen-transitions/package.json";

const currentPackage = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const currentVersion = currentPackage.version;
const packageName = currentPackage.name;

let result = {
	packageName,
	version: currentVersion,
	shouldRelease: false,
	reason: "No release decision has been made.",
};

if (currentVersion.includes("-")) {
	result.reason = `Skipping stable release because ${currentVersion} is a prerelease version.`;
} else if (remoteTagExists(`v${currentVersion}`)) {
	result.reason = `Skipping release because git tag v${currentVersion} already exists.`;
} else if (npmVersionExists(packageName, currentVersion)) {
	result.reason = `Skipping release because ${packageName}@${currentVersion} is already published to npm.`;
} else {
	result = {
		packageName,
		version: currentVersion,
		shouldRelease: true,
		reason: `Publishing ${packageName}@${currentVersion}; stable version is unpublished on npm and tag v${currentVersion} is free.`,
	};
}

writeOutput("should_release", String(result.shouldRelease));
writeOutput("version", result.version);
writeOutput("reason", result.reason);

console.log(JSON.stringify(result, null, 2));

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

function writeOutput(name, value) {
	const outputPath = process.env.GITHUB_OUTPUT;

	if (!outputPath) {
		return;
	}

	appendFileSync(outputPath, `${name}=${value}\n`);
}
