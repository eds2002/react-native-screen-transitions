#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";

const [channel, increment = "prerelease", dryRun = "true", publishNpm = "true"] =
	process.argv.slice(2);
const channels = new Set(["latest", "alpha", "beta", "rc"]);
const increments = new Set(["prerelease", "prepatch", "preminor", "premajor"]);
const booleans = new Set(["true", "false"]);

if (!channels.has(channel)) {
	console.error(`Unsupported release channel: ${channel}`);
	process.exit(1);
}

if (!increments.has(increment)) {
	console.error(`Unsupported release increment: ${increment}`);
	process.exit(1);
}

if (!booleans.has(dryRun) || !booleans.has(publishNpm)) {
	console.error("dry_run and publish_npm arguments must be true or false.");
	process.exit(1);
}

const ref = channel === "latest" ? "main" : readReleaseBranch(channel);
const args = [
	"workflow",
	"run",
	"release.yml",
	"--ref",
	ref,
	"-f",
	`channel=${channel}`,
	"-f",
	`increment=${increment}`,
	"-f",
	`dry_run=${dryRun}`,
	"-f",
	`publish_npm=${publishNpm}`,
];
const result = spawnSync("gh", args, { stdio: "inherit" });

process.exit(result.status ?? 1);

function readReleaseBranch(releaseChannel) {
	const branch = execFileSync("git", ["branch", "--show-current"], {
		encoding: "utf8",
	}).trim();

	if (!/^release\/v\d+(?:\.\d+){0,2}$/.test(branch)) {
		console.error(
			`Run ${releaseChannel} releases from a release/v* branch. Current branch: ${branch || "(detached)"}.`,
		);
		process.exit(1);
	}

	return branch;
}
