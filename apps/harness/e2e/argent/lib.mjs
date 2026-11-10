// Shared by the Argent e2e tests' script steps (apps/harness/.argent/e2e): screen recording and the
// visual analyzer around a test's gestures, plus reads of the debug bridge's state.
//
// Script steps take no arguments and don't know the run's device, so:
//   - the device is read from apps/harness/.argent/device (run.sh writes it), else the only booted
//     iOS simulator or adb device;
//   - record-start.mjs records into results/argent/current; each test's <name>.check.mjs stops it,
//     analyzes it and moves it to results/argent/<name>.
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const E2E = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HARNESS = path.resolve(E2E, "..");
const RESULTS = path.join(E2E, "results", "argent");
const CURRENT = path.join(RESULTS, "current");

const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });

export function device() {
	const file = path.join(HARNESS, ".argent", "device");
	if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();
	const sims = JSON.parse(sh("xcrun", ["simctl", "list", "devices", "booted", "--json"])).devices;
	const booted = Object.values(sims).flat().map((d) => d.udid);
	const adb = sh("adb", ["devices"]).split("\n").slice(1).filter((l) => /\tdevice$/.test(l)).map((l) => l.split("\t")[0]);
	const all = [...booted, ...adb];
	if (all.length !== 1) throw new Error(`no single device: write its id to apps/harness/.argent/device (found ${all.join(", ") || "none"})`);
	return all[0];
}

const isAndroid = (id) => !/^[0-9A-F]{8}-/.test(id);

/** The bridge summary (labs/bridge.tsx), read from the hidden harness-state element. */
export function state(id = device()) {
	return JSON.parse(sh(path.join(E2E, "state.sh"), [id]));
}

/** Waits until every screen has settled, and the focused path is `path` when given. */
export function waitSettled(path = "", timeoutMs = 15000) {
	const id = device();
	const deadline = Date.now() + timeoutMs;
	let last;
	while (Date.now() < deadline) {
		try {
			last = state(id);
			if (last.settled && (!path || last.path === path)) return last;
		} catch {
			// The tree can be briefly unreadable mid-transition.
		}
		execFileSync("sleep", ["0.2"]);
	}
	throw new Error(`not settled${path ? ` on ${path}` : ""} after ${timeoutMs} ms: ${JSON.stringify(last && { path: last.path, settled: last.settled, screens: last.screens })}`);
}

export function startRecording() {
	const id = device();
	// A test that failed before its check never stopped its recorder, and a device takes one recording
	// at a time: stop the leftover one, or every later test records nothing.
	// Match by device, not by a saved pid: a later test may have overwritten the pid file.
	try {
		if (isAndroid(id)) sh("adb", ["-s", id, "shell", "pkill", "-INT", "screenrecord"]);
		else {
			sh("pkill", ["-INT", "-f", `simctl io ${id} recordVideo`]);
			for (let i = 0; i < 50; i++) {
				try {
					sh("pgrep", ["-f", `simctl io ${id} recordVideo`]);
				} catch {
					break; // none left
				}
				execFileSync("sleep", ["0.1"]);
			}
		}
	} catch {
		// No leftover recording.
	}
	fs.rmSync(CURRENT, { recursive: true, force: true });
	fs.mkdirSync(CURRENT, { recursive: true });
	const info = { device: id, android: isAndroid(id), before: state(id) };
	let child;
	if (info.android) {
		const px = sh("adb", ["-s", id, "shell", "wm", "size"]).match(/Physical size: (\d+)x(\d+)/);
		const dpi = Number(sh("adb", ["-s", id, "shell", "wm", "density"]).match(/Physical density: (\d+)/)[1]);
		const [w, h] = [Number(px[1]), Number(px[2])];
		info.points = `${Math.round((w * 160) / dpi)}x${Math.round((h * 160) / dpi)}`;
		sh("adb", ["-s", id, "shell", "rm", "-f", "/sdcard/harness-run.mp4"]);
		// Half resolution in the screen's own shape (the default is letterboxed into the encoder's size).
		child = spawn("adb", ["-s", id, "shell", "screenrecord", "--size", `${Math.floor(w / 4) * 2}x${Math.floor(h / 4) * 2}`, "--bit-rate", "20000000", "/sdcard/harness-run.mp4"], { detached: true, stdio: "ignore" });
	} else {
		child = spawn("xcrun", ["simctl", "io", id, "recordVideo", "--codec=h264", "--force", path.join(CURRENT, "run.mov")], { detached: true, stdio: "ignore" });
	}
	child.unref();
	info.pid = child.pid;
	fs.writeFileSync(path.join(CURRENT, "recording.json"), JSON.stringify(info));
	execFileSync("sleep", ["1.5"]);
}

/**
 * Stops the recording, runs the analyzer and the test's own check, and keeps everything under
 * results/argent/<name>. Throws (failing the step) on a blank, flicker, jump or pop-in, or when check() returns
 * a message. check(before, after) gets the bridge state at the start of the recording and now.
 */
export function finish(name, { analyze = [], check, flaky = false } = {}) {
	const { info, after, out } = stopRecording(name);
	const args = [path.join(E2E, "visual", "analyze.py"), path.join(out, "run.mov"), "--out", out, ...analyze];
	if (info.points) args.push("--points", info.points);
	try {
		execFileSync("python3", ["-I", ...args], { stdio: ["ignore", "ignore", "pipe"] });
	} catch {
		// analyze.py exits non-zero when it flags events; the report says which.
	}
	const report = JSON.parse(fs.readFileSync(path.join(out, "report.json"), "utf8"));
	const events = report.summary.events;
	const problems = [];
	if (events.blank) problems.push(`${events.blank} blank`);
	if (events.flicker) problems.push(`${events.flicker} flicker`);
	if (events.jump) problems.push(`${events.jump} jump`);
	if (events["pop-in"]) problems.push(`${events["pop-in"]} pop-in`);
	const message = check?.(info.before, after);
	if (message) problems.push(message);
	const line = `${name}: ${Object.entries(events).map(([k, v]) => `${k} ${v}`).join(", ")} (${out})`;
	// For visual/review.py: the scenario's verdict, and whether a failure is tolerated.
	fs.writeFileSync(path.join(out, "scenario.json"), JSON.stringify({ exit: problems.length ? 1 : 0, log: problems.join("\n") }));
	if (flaky) fs.writeFileSync(path.join(out, "flaky"), "");
	if (problems.length && !flaky) throw new Error(`${problems.join("; ")}. ${line}`);
	if (problems.length) console.log(`FLAKY (tolerated): ${problems.join("; ")}`);
	console.log(line);
}

/**
 * Stops the recording startRecording() began and moves it, with what it recorded, to
 * results/argent/<name>. Returns the recording's info, the bridge state now, and that folder.
 * `read(id)` reads the state (the bridge summary by default).
 */
export function stopRecording(name, read = state) {
	const info = JSON.parse(fs.readFileSync(path.join(CURRENT, "recording.json"), "utf8"));
	execFileSync("sleep", ["1"]);
	const after = read(info.device);
	if (info.android) {
		sh("adb", ["-s", info.device, "shell", "pkill", "-INT", "screenrecord"]);
		execFileSync("sleep", ["1"]);
		sh("adb", ["-s", info.device, "pull", "/sdcard/harness-run.mp4", path.join(CURRENT, "run.mov")]);
	} else {
		process.kill(info.pid, "SIGINT");
		for (let i = 0; i < 50 && isAlive(info.pid); i++) execFileSync("sleep", ["0.1"]);
	}
	const out = path.join(RESULTS, name);
	fs.rmSync(out, { recursive: true, force: true });
	fs.renameSync(CURRENT, out);
	return { info, after, out };
}

function isAlive(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}
