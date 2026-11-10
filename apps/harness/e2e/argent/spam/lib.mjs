// Shared by the spam matrix's Argent e2e tests (apps/harness/.argent/e2e/spam, written by
// e2e/scenarios/spam-matrix.py --emit). Each test records the boundary lab while its finger script
// plays; its check stops the recording, tracks the marked element (visual/marker.py) and checks where
// the stack ended, with the matrix's verdict.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stopRecording } from "../lib.mjs";

const E2E = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** The bridge state plus the levels the focused detail screens show (their "at:… level:N" text). */
function readState(id) {
	const raw = execFileSync("argent", ["run", "describe", "--udid", id, "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
	const description = JSON.parse(raw.slice(raw.indexOf("{"))).description;
	const m = description.match(/"(\{\\?"lab.*?\})" id="harness-state"/);
	const bridge = m ? JSON.parse(m[1].replaceAll('\\"', '"')) : {};
	const levels = [...description.matchAll(/at:\S+ level:(\d+)/g)].map((x) => Number(x[1]));
	return { ...bridge, levels: [...new Set(levels)].sort((a, b) => a - b) };
}

/**
 * Fails the step on what the matrix flags: the element missing, doubled, jumping or resizing (when
 * the run tracks it), lab errors, a stack that never settled, or an end level other than the one the
 * finger script leads to.
 */
export function finishSpam(name, { track = true, level }) {
	const { info, after, out } = stopRecording(name, readState);
	const problems = [];
	if (track) {
		let verdict = {};
		try {
			const res = execFileSync("python3", ["-I", path.join(E2E, "visual", "marker.py"), path.join(out, "run.mov"), "--json", path.join(out, "track.json"), ...(info.points ? ["--points", info.points.split("x")[0]] : [])], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
			verdict = JSON.parse(res.split("\n")[0]);
		} catch (e) {
			// marker.py exits 1 when it flags something: its first line is still the verdict.
			const first = String(e.stdout ?? "").split("\n")[0];
			verdict = first ? JSON.parse(first) : { error: "marker.py produced no verdict" };
		}
		if (verdict.error) problems.push(verdict.error);
		for (const [kind, count] of Object.entries(verdict.events ?? {})) if (count) problems.push(`${count} ${kind}`);
		fs.writeFileSync(path.join(out, "marker.json"), JSON.stringify(verdict));
	}
	const end = (after.path ?? "").endsWith("List") ? 0 : Math.max(0, ...(after.levels ?? []));
	if (after.errors) problems.push(`${after.errors} lab errors`);
	if (after.settled === false) problems.push("not settled");
	if (end !== level) problems.push(`ended on level ${end} (${after.path}), expected ${level}`);
	fs.writeFileSync(path.join(out, "scenario.json"), JSON.stringify({ exit: problems.length ? 1 : 0, log: problems.join("\n") }));
	const line = `${name}: ${problems.length ? problems.join("; ") : "clean"} (${out})`;
	if (problems.length) {
		// The step's failure reason is the verdict: no stack trace after it.
		const error = new Error(line);
		error.stack = line;
		throw error;
	}
	console.log(line);
}
