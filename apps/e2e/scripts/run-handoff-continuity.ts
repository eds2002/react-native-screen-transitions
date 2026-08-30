import { resolve } from "node:path";

const appRoot = resolve(import.meta.dir, "..");
const outputPath = resolve(
	process.argv[2] ?? `/tmp/handoff-continuity-${Date.now()}.mov`,
);

const sleep = (ms: number) =>
	new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function findBootedSimulator() {
	const configuredDevice =
		process.env.MAESTRO_DEVICE ?? process.env.MAESTRO_UDID;
	if (configuredDevice) {
		return configuredDevice;
	}

	const list = Bun.spawn(
		["xcrun", "simctl", "list", "devices", "booted", "--json"],
		{
			stderr: "pipe",
			stdout: "pipe",
		},
	);
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(list.stdout).text(),
		new Response(list.stderr).text(),
		list.exited,
	]);

	if (exitCode !== 0) {
		throw new Error(`Unable to list iOS simulators: ${stderr.trim()}`);
	}

	const parsed = JSON.parse(stdout) as {
		devices?: Record<string, Array<{ state?: string; udid?: string }>>;
	};
	const booted = Object.entries(parsed.devices ?? {})
		.filter(([runtime]) => runtime.includes("iOS"))
		.flatMap(([, devices]) => devices)
		.filter(
			(device): device is { state: string; udid: string } =>
				device.state === "Booted" && typeof device.udid === "string",
		);

	if (booted.length !== 1) {
		throw new Error(
			`Expected one booted iOS simulator, found ${booted.length}. Set MAESTRO_DEVICE to the intended UDID.`,
		);
	}

	return booted[0].udid;
}

async function stopRecording(recording: Bun.Subprocess) {
	recording.kill("SIGINT");
	const stopped = await Promise.race([
		recording.exited.then(() => true),
		sleep(5000).then(() => false),
	]);

	if (!stopped) {
		recording.kill("SIGTERM");
		await recording.exited;
	}
}

async function runMaestro(udid: string, flowPath: string) {
	const maestro = Bun.spawn(["bun", "scripts/run-maestro.ts"], {
		cwd: appRoot,
		env: {
			...process.env,
			MAESTRO_DEVICE: udid,
			MAESTRO_FLOW: flowPath,
			MAESTRO_PLATFORM: "ios",
		},
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
	});
	return maestro.exited;
}

const udid = await findBootedSimulator();
const setupExitCode = await runMaestro(
	udid,
	".maestro/handoff-continuity-setup.yaml",
);

if (setupExitCode !== 0) {
	throw new Error(
		`Handoff continuity setup failed with exit code ${setupExitCode}`,
	);
}

console.log(`[handoff-continuity] recording simulator ${udid}`);
console.log(`[handoff-continuity] output: ${outputPath}`);

const recording = Bun.spawn(
	[
		"xcrun",
		"simctl",
		"io",
		udid,
		"recordVideo",
		"--codec=h264",
		"--force",
		outputPath,
	],
	{
		stderr: "inherit",
		stdout: "inherit",
	},
);

await sleep(500);

const maestroExitCode = await runMaestro(
	udid,
	".maestro/handoff-continuity-stress.yaml",
);
await stopRecording(recording);

if (maestroExitCode !== 0) {
	throw new Error(
		`Handoff continuity flow failed with exit code ${maestroExitCode}; recording kept at ${outputPath}`,
	);
}

const verifier = Bun.spawn(
	["bun", "scripts/verify-handoff-continuity.ts", outputPath],
	{
		cwd: appRoot,
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
	},
);
const verifierExitCode = await verifier.exited;

if (verifierExitCode !== 0) {
	process.exit(verifierExitCode);
}
