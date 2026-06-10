#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const prereleaseChannel = process.env.RELEASE_PRERELEASE;

if (!prereleaseChannel) {
	process.exit(0);
}

if (!["alpha", "beta", "rc"].includes(prereleaseChannel)) {
	console.error(`Unsupported prerelease channel: ${prereleaseChannel}`);
	process.exit(1);
}

const branch = execFileSync("git", ["branch", "--show-current"], {
	encoding: "utf8",
}).trim();

if (!branch) {
	console.error("Prereleases must run from a branch, not a detached HEAD.");
	process.exit(1);
}

if (branch === "main") {
	console.error("Prereleases must run from a branch other than main.");
	process.exit(1);
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const result = spawnSync("bun", ["test"], {
	cwd: repoRoot,
	stdio: "inherit",
});

process.exit(result.status ?? 1);
