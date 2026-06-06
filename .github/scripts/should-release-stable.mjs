#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";

const packageJsonPath =
	process.env.PACKAGE_JSON_PATH ??
	"packages/react-native-screen-transitions/package.json";
const beforeRef = process.env.GITHUB_EVENT_BEFORE;
const currentRef = process.env.GITHUB_SHA ?? "HEAD";

const currentPackage = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const currentVersion = currentPackage.version;
const packageName = currentPackage.name;
const baseRef = resolveBaseRef(beforeRef, currentRef);
const beforeVersion = baseRef ? readVersionAtRef(baseRef, packageJsonPath) : null;

let result = {
	packageName,
	version: currentVersion,
	shouldRelease: false,
	reason: "No release decision has been made.",
};

if (!beforeVersion) {
	result.reason = "Skipping release because the previous package version could not be resolved.";
} else if (beforeVersion === currentVersion) {
	result.reason = `Skipping release because ${packageJsonPath} version stayed at ${currentVersion}.`;
} else if (currentVersion.includes("-")) {
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
		reason: `Publishing ${packageName}@${currentVersion}; package version changed from ${beforeVersion}.`,
	};
}

writeOutput("should_release", String(result.shouldRelease));
writeOutput("version", result.version);
writeOutput("reason", result.reason);

console.log(JSON.stringify(result, null, 2));

function resolveBaseRef(eventBeforeRef, fallbackCurrentRef) {
	if (
		eventBeforeRef &&
		!/^[0]+$/.test(eventBeforeRef) &&
		commitExists(eventBeforeRef)
	) {
		return eventBeforeRef;
	}

	const parentRef = `${fallbackCurrentRef}^`;

	if (commitExists(parentRef)) {
		return parentRef;
	}

	return null;
}

function commitExists(ref) {
	try {
		execFileSync("git", ["cat-file", "-e", `${ref}^{commit}`], {
			stdio: "ignore",
		});
		return true;
	} catch {
		return false;
	}
}

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
		execFileSync("git", ["ls-remote", "--exit-code", "--tags", "origin", `refs/tags/${tagName}`], {
			stdio: "ignore",
		});
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
