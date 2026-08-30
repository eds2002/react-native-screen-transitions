import { resolve } from "node:path";

type VideoMetadata = {
	width: number;
	height: number;
	fps: number;
};

type Thresholds = {
	adjacent: number;
	quiet: number;
	returning: number;
	ratio: number;
};

type NormalizedRegion = {
	x: number;
	y: number;
	width: number;
	height: number;
};

type PixelRegion = {
	x: number;
	y: number;
	width: number;
	height: number;
};

type Impulse = {
	frame: number;
	durationFrames: number;
	timeSeconds: number;
	tiles: number;
	worstAdjacentDifference: number;
	worstReturnDifference: number;
	worstRatio: number;
	worstRegionX: number;
	worstRegionY: number;
};

const DEFAULT_WIDTH = 120;
const TILE_SIZE = 12;
const DEFAULT_MAX_DURATION = 8;
const DEFAULT_REGION: NormalizedRegion = {
	x: 0.25,
	y: 0.17,
	width: 0.5,
	height: 0.22,
};
const DEFAULT_THRESHOLDS: Thresholds = {
	adjacent: 4,
	quiet: 1.5,
	returning: 1.5,
	ratio: 4,
};

function fail(message: string): never {
	throw new Error(`[handoff-continuity] ${message}`);
}

function parsePositiveNumber(value: string | undefined, option: string) {
	const parsed = Number(value);
	if (!(parsed > 0)) {
		fail(`${option} must be a positive number`);
	}
	return parsed;
}

function parseRegion(value: string | undefined): NormalizedRegion {
	const values = value?.split(",").map(Number) ?? [];
	if (values.length !== 4 || values.some((entry) => !Number.isFinite(entry))) {
		fail("--roi must contain four comma-separated numbers: x,y,width,height");
	}

	const [x, y, width, height] = values;
	if (
		x < 0 ||
		y < 0 ||
		width <= 0 ||
		height <= 0 ||
		x + width > 1 ||
		y + height > 1
	) {
		fail(
			"--roi coordinates must describe a normalized region inside the video",
		);
	}

	return { x, y, width, height };
}

function parseArguments() {
	const args = process.argv.slice(2);
	const videoPath = args.shift();

	if (!videoPath || videoPath.startsWith("--")) {
		fail(
			"usage: bun scripts/verify-handoff-continuity.ts <recording> [--roi x,y,width,height] [--max-duration 8] [--width 120] [--adjacent 4] [--quiet 1.5] [--returning 1.5] [--ratio 4]",
		);
	}

	let width = DEFAULT_WIDTH;
	let maxDuration = DEFAULT_MAX_DURATION;
	let region = DEFAULT_REGION;
	const thresholds = { ...DEFAULT_THRESHOLDS };

	while (args.length > 0) {
		const option = args.shift();
		const value = args.shift();

		switch (option) {
			case "--roi":
				region = parseRegion(value);
				break;
			case "--max-duration":
				maxDuration = Math.round(parsePositiveNumber(value, option));
				break;
			case "--width":
				width = Math.round(parsePositiveNumber(value, option));
				break;
			case "--adjacent":
				thresholds.adjacent = parsePositiveNumber(value, option);
				break;
			case "--quiet":
				thresholds.quiet = parsePositiveNumber(value, option);
				break;
			case "--returning":
				thresholds.returning = parsePositiveNumber(value, option);
				break;
			case "--ratio":
				thresholds.ratio = parsePositiveNumber(value, option);
				break;
			default:
				fail(`unknown option: ${String(option)}`);
		}
	}

	return {
		videoPath: resolve(videoPath),
		width,
		maxDuration,
		region,
		thresholds,
	};
}

async function runTextCommand(command: string[]) {
	const process = Bun.spawn(command, {
		stderr: "pipe",
		stdout: "pipe",
	});
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(process.stdout).text(),
		new Response(process.stderr).text(),
		process.exited,
	]);

	if (exitCode !== 0) {
		fail(`${command[0]} failed: ${stderr.trim()}`);
	}

	return stdout;
}

async function probeVideo(videoPath: string): Promise<VideoMetadata> {
	const output = await runTextCommand([
		"ffprobe",
		"-v",
		"error",
		"-select_streams",
		"v:0",
		"-show_entries",
		"stream=width,height,avg_frame_rate",
		"-of",
		"json",
		videoPath,
	]);
	const parsed = JSON.parse(output) as {
		streams?: Array<{
			width?: number;
			height?: number;
			avg_frame_rate?: string;
		}>;
	};
	const stream = parsed.streams?.[0];
	const [numerator, denominator] = (stream?.avg_frame_rate ?? "0/1")
		.split("/")
		.map(Number);
	const fps = numerator / denominator;

	if (!(stream?.width && stream.height && fps > 0)) {
		fail("recording has no readable video stream");
	}

	return {
		width: stream.width,
		height: stream.height,
		fps,
	};
}

function meanTileDifference(
	left: Uint8Array,
	right: Uint8Array,
	frameWidth: number,
	xStart: number,
	yStart: number,
	xEnd: number,
	yEnd: number,
) {
	let total = 0;
	let samples = 0;

	for (let y = yStart; y < yEnd; y++) {
		const row = y * frameWidth;
		for (let x = xStart; x < xEnd; x++) {
			total += Math.abs(left[row + x] - right[row + x]);
			samples++;
		}
	}

	return total / samples;
}

function tileDifferences(
	left: Uint8Array,
	right: Uint8Array,
	frameWidth: number,
	frameHeight: number,
) {
	const columns = Math.ceil(frameWidth / TILE_SIZE);
	const rows = Math.ceil(frameHeight / TILE_SIZE);
	const differences = new Float32Array(columns * rows);
	let index = 0;

	for (let y = 0; y < frameHeight; y += TILE_SIZE) {
		for (let x = 0; x < frameWidth; x += TILE_SIZE) {
			differences[index] = meanTileDifference(
				left,
				right,
				frameWidth,
				x,
				y,
				Math.min(x + TILE_SIZE, frameWidth),
				Math.min(y + TILE_SIZE, frameHeight),
			);
			index++;
		}
	}

	return differences;
}

function meanDifference(differences: Float32Array) {
	let total = 0;
	for (const difference of differences) {
		total += difference;
	}
	return total / differences.length;
}

function inspectExcursion(
	previousToBefore: Float32Array,
	beforeToFirst: Float32Array,
	lastToAfter: Float32Array,
	afterToNext: Float32Array,
	beforeToAfter: Float32Array,
	frame: number,
	durationFrames: number,
	metadata: VideoMetadata,
	sourceRegion: PixelRegion,
	frameWidth: number,
	frameHeight: number,
	thresholds: Thresholds,
): Impulse | null {
	if (
		Math.max(meanDifference(previousToBefore), meanDifference(afterToNext)) >
			thresholds.quiet ||
		meanDifference(beforeToAfter) > thresholds.returning
	) {
		return null;
	}

	let tiles = 0;
	let worstAdjacentDifference = 0;
	let worstReturnDifference = 0;
	let worstRatio = 0;
	let worstRegionX = 0;
	let worstRegionY = 0;
	let tileIndex = 0;

	for (let y = 0; y < frameHeight; y += TILE_SIZE) {
		for (let x = 0; x < frameWidth; x += TILE_SIZE) {
			const adjacentDifference = Math.min(
				beforeToFirst[tileIndex],
				lastToAfter[tileIndex],
			);
			const returnDifference = beforeToAfter[tileIndex];
			const ratio = adjacentDifference / Math.max(returnDifference, 0.25);

			if (
				adjacentDifference < thresholds.adjacent ||
				Math.max(previousToBefore[tileIndex], afterToNext[tileIndex]) >
					thresholds.quiet ||
				returnDifference > thresholds.returning ||
				ratio < thresholds.ratio
			) {
				tileIndex++;
				continue;
			}

			tiles++;
			if (adjacentDifference > worstAdjacentDifference) {
				worstRegionX =
					(sourceRegion.x + (x / frameWidth) * sourceRegion.width) /
					metadata.width;
				worstRegionY =
					(sourceRegion.y + (y / frameHeight) * sourceRegion.height) /
					metadata.height;
			}
			worstAdjacentDifference = Math.max(
				worstAdjacentDifference,
				adjacentDifference,
			);
			worstReturnDifference = Math.max(worstReturnDifference, returnDifference);
			worstRatio = Math.max(worstRatio, ratio);
			tileIndex++;
		}
	}

	if (tiles === 0) {
		return null;
	}

	return {
		frame,
		durationFrames,
		timeSeconds: frame / metadata.fps,
		tiles,
		worstAdjacentDifference,
		worstReturnDifference,
		worstRatio,
		worstRegionX,
		worstRegionY,
	};
}

async function inspectVideo(
	videoPath: string,
	metadata: VideoMetadata,
	sourceRegion: PixelRegion,
	frameWidth: number,
	maxDuration: number,
	thresholds: Thresholds,
) {
	const frameHeight = Math.max(
		2,
		Math.round((sourceRegion.height / sourceRegion.width) * frameWidth),
	);
	const frameBytes = frameWidth * frameHeight;
	const ffmpeg = Bun.spawn(
		[
			"ffmpeg",
			"-v",
			"error",
			"-i",
			videoPath,
			"-vf",
			`crop=${sourceRegion.width}:${sourceRegion.height}:${sourceRegion.x}:${sourceRegion.y},scale=${frameWidth}:${frameHeight},format=gray`,
			"-pix_fmt",
			"gray",
			"-fps_mode",
			"passthrough",
			"-f",
			"rawvideo",
			"pipe:1",
		],
		{
			stderr: "pipe",
			stdout: "pipe",
		},
	);
	const reader = ffmpeg.stdout.getReader();
	let pending = new Uint8Array(0);
	let frameIndex = 0;
	const history: Uint8Array[] = [];
	const adjacentDifferences: Float32Array[] = [];
	const impulses: Impulse[] = [];

	const consumeFrame = (next: Uint8Array) => {
		const previous = history.at(-1);
		if (previous) {
			adjacentDifferences.push(
				tileDifferences(previous, next, frameWidth, frameHeight),
			);
		}
		history.push(next);
		if (history.length > maxDuration + 4) {
			history.shift();
			adjacentDifferences.shift();
		}

		for (
			let durationFrames = 1;
			durationFrames <= Math.min(maxDuration, history.length - 4);
			durationFrames++
		) {
			const firstIndex = history.length - durationFrames - 2;
			const beforeToAfter = tileDifferences(
				history[firstIndex - 1],
				history[history.length - 2],
				frameWidth,
				frameHeight,
			);
			const impulse = inspectExcursion(
				adjacentDifferences[firstIndex - 2],
				adjacentDifferences[firstIndex - 1],
				adjacentDifferences[history.length - 3],
				adjacentDifferences[history.length - 2],
				beforeToAfter,
				frameIndex - durationFrames - 1,
				durationFrames,
				metadata,
				sourceRegion,
				frameWidth,
				frameHeight,
				thresholds,
			);
			if (impulse) {
				impulses.push(impulse);
			}
		}
		frameIndex++;
	};

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		const combined = new Uint8Array(pending.length + value.length);
		combined.set(pending);
		combined.set(value, pending.length);
		let offset = 0;

		while (combined.length - offset >= frameBytes) {
			consumeFrame(combined.slice(offset, offset + frameBytes));
			offset += frameBytes;
		}

		pending = combined.slice(offset);
	}

	const [stderr, exitCode] = await Promise.all([
		new Response(ffmpeg.stderr).text(),
		ffmpeg.exited,
	]);

	if (exitCode !== 0) {
		fail(`ffmpeg failed: ${stderr.trim()}`);
	}
	if (pending.length !== 0) {
		fail(`ffmpeg returned an incomplete frame (${pending.length} bytes)`);
	}

	const distinctImpulses = impulses.reduce<Impulse[]>((distinct, impulse) => {
		const previous = distinct.at(-1);
		if (
			previous &&
			impulse.frame <= previous.frame + previous.durationFrames + 1
		) {
			previous.frame = Math.min(previous.frame, impulse.frame);
			previous.durationFrames = Math.max(
				previous.durationFrames,
				impulse.frame + impulse.durationFrames - previous.frame,
			);
			previous.tiles = Math.max(previous.tiles, impulse.tiles);
			if (impulse.worstAdjacentDifference > previous.worstAdjacentDifference) {
				previous.worstAdjacentDifference = impulse.worstAdjacentDifference;
				previous.worstRegionX = impulse.worstRegionX;
				previous.worstRegionY = impulse.worstRegionY;
			}
			previous.worstReturnDifference = Math.max(
				previous.worstReturnDifference,
				impulse.worstReturnDifference,
			);
			previous.worstRatio = Math.max(previous.worstRatio, impulse.worstRatio);
			return distinct;
		}

		distinct.push({ ...impulse });
		return distinct;
	}, []);

	return { frameCount: frameIndex, impulses: distinctImpulses };
}

function resolveRegion(
	metadata: VideoMetadata,
	region: NormalizedRegion,
): PixelRegion {
	const x = Math.floor((metadata.width * region.x) / 2) * 2;
	const y = Math.floor((metadata.height * region.y) / 2) * 2;
	const right = Math.min(
		metadata.width,
		Math.ceil((metadata.width * (region.x + region.width)) / 2) * 2,
	);
	const bottom = Math.min(
		metadata.height,
		Math.ceil((metadata.height * (region.y + region.height)) / 2) * 2,
	);

	return {
		x,
		y,
		width: right - x,
		height: bottom - y,
	};
}

const { videoPath, width, maxDuration, region, thresholds } = parseArguments();
const metadata = await probeVideo(videoPath);
const sourceRegion = resolveRegion(metadata, region);
const result = await inspectVideo(
	videoPath,
	metadata,
	sourceRegion,
	width,
	maxDuration,
	thresholds,
);

console.log(
	`[handoff-continuity] inspected ${result.frameCount} frames at ${metadata.fps.toFixed(2)} fps in roi=${region.x},${region.y},${region.width},${region.height}`,
);

if (result.impulses.length > 0) {
	for (const impulse of result.impulses.slice(0, 20)) {
		console.error(
			`[handoff-continuity] frame ${impulse.frame} (${impulse.timeSeconds.toFixed(3)}s), ${impulse.durationFrames} frame(s): ${impulse.tiles} transient tile(s), region=${impulse.worstRegionX.toFixed(2)},${impulse.worstRegionY.toFixed(2)}, adjacent=${impulse.worstAdjacentDifference.toFixed(2)}, return=${impulse.worstReturnDifference.toFixed(2)}, ratio=${impulse.worstRatio.toFixed(2)}`,
		);
	}
	if (result.impulses.length > 20) {
		console.error(
			`[handoff-continuity] …and ${result.impulses.length - 20} more transient frames`,
		);
	}
	console.error(
		`[handoff-continuity] FAIL — ${result.impulses.length} transient visual excursion(s) found; handoff output is not continuous`,
	);
	process.exit(1);
}

console.log(
	`[handoff-continuity] PASS — no one-to-${maxDuration}-frame endpoint visual excursions found`,
);
