import { resolve } from "node:path";

const appRoot = resolve(import.meta.dir, "..");
const flowPath = process.env.MAESTRO_FLOW ?? ".maestro/maestro-suite.yaml";
const host = process.env.METRO_HOST ?? "localhost";
const port = process.env.METRO_PORT ?? "8081";
const metroStatusUrl = `http://${host}:${port}/status`;
const shouldSkipMetro = process.env.MAESTRO_SKIP_METRO === "1";
const maestroPlatform = process.env.MAESTRO_PLATFORM ?? "ios";
const maestroDevice = process.env.MAESTRO_DEVICE ?? process.env.MAESTRO_UDID;

const sleep = (ms: number) =>
	new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function isMetroReady() {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 1000);

	try {
		const response = await fetch(metroStatusUrl, {
			signal: controller.signal,
		});

		if (!response.ok) {
			return false;
		}

		const body = await response.text();
		return body.includes("running") || body.length > 0;
	} catch {
		return false;
	} finally {
		clearTimeout(timeout);
	}
}

async function waitForMetro(
	metro: Bun.Subprocess<"ignore", "inherit", "inherit">,
) {
	const timeoutMs = Number(process.env.METRO_START_TIMEOUT_MS ?? 60000);
	const startedAt = Date.now();
	const exited = metro.exited.then((code) => ({ code }));

	while (Date.now() - startedAt < timeoutMs) {
		if (await isMetroReady()) {
			return;
		}

		const exitResult = await Promise.race([exited, sleep(500).then(() => null)]);
		if (exitResult) {
			throw new Error(`Metro exited before it was ready (code ${exitResult.code})`);
		}
	}

	throw new Error(`Metro did not become ready at ${metroStatusUrl}`);
}

async function stopMetro(
	metro: Bun.Subprocess<"ignore", "inherit", "inherit"> | undefined,
) {
	if (!metro) {
		return;
	}

	metro.kill("SIGINT");
	const exited = await Promise.race([metro.exited, sleep(5000).then(() => null)]);

	if (exited === null) {
		metro.kill("SIGTERM");
		await Promise.race([metro.exited, sleep(2000)]);
	}
}

let startedMetro: Bun.Subprocess<"ignore", "inherit", "inherit"> | undefined;

process.on("SIGINT", () => {
	void stopMetro(startedMetro).finally(() => process.exit(130));
});

try {
	if (shouldSkipMetro) {
		console.log("[maestro] skipping Metro startup because MAESTRO_SKIP_METRO=1");
	} else if (await isMetroReady()) {
		console.log(`[maestro] using existing Metro server at ${metroStatusUrl}`);
	} else {
		console.log(`[maestro] starting Metro at ${metroStatusUrl}`);
		startedMetro = Bun.spawn(
			["bun", "run", "start", "--", "--host", host, "--port", port],
			{
				cwd: appRoot,
				env: {
					...process.env,
					EXPO_NO_TELEMETRY: "1",
				},
				stdin: "ignore",
				stdout: "inherit",
				stderr: "inherit",
			},
		);
		await waitForMetro(startedMetro);
	}

	const maestroArgs = [
		"--platform",
		maestroPlatform,
		...(maestroDevice ? ["--device", maestroDevice] : []),
		"test",
		flowPath,
		...process.argv.slice(2),
	];
	console.log(`[maestro] running maestro ${maestroArgs.join(" ")}`);

	const maestro = Bun.spawn(["maestro", ...maestroArgs], {
		cwd: appRoot,
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
	});
	const exitCode = await maestro.exited;

	await stopMetro(startedMetro);
	process.exit(exitCode);
} catch (error) {
	await stopMetro(startedMetro);
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
