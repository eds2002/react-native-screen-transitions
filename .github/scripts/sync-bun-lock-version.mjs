#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const packageJsonPath = resolve(
	repoRoot,
	"packages/react-native-screen-transitions/package.json",
);
const lockfilePath = resolve(repoRoot, "bun.lock");
const workspacePath = "packages/react-native-screen-transitions";
const { version } = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const lockfile = readFileSync(lockfilePath, "utf8");
const workspaceVersionPattern = new RegExp(
	`("${escapeRegExp(workspacePath)}": \\{[\\s\\S]*?\\n\\s+"version": ")([^"]+)(",)`,
);
const match = workspaceVersionPattern.exec(lockfile);

if (!match) {
	console.error(`Could not update ${workspacePath} version in bun.lock.`);
	process.exit(1);
}

if (match[2] === version) {
	process.exit(0);
}

const nextLockfile = lockfile.replace(
	workspaceVersionPattern,
	`$1${version}$3`,
);

writeFileSync(lockfilePath, nextLockfile);

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
