import { BENCHMARK_JANK_FRAME_THRESHOLD_MS } from "./constants";
import type { MetricSummary } from "./types";

const EMPTY_SUMMARY: MetricSummary = {
	mean: 0,
	p95: 0,
};

const percentile = (values: number[], percentileValue: number): number => {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const index = (sorted.length - 1) * percentileValue;
	const lower = Math.floor(index);
	const upper = Math.ceil(index);
	if (lower === upper) return sorted[lower];
	const weight = index - lower;
	return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
};

export function computeMetricSummary(values: number[]): MetricSummary {
	if (values.length === 0) return EMPTY_SUMMARY;

	const total = values.reduce((sum, value) => sum + value, 0);
	return {
		mean: total / values.length,
		p95: percentile(values, 0.95),
	};
}

export function computeFrameStats(frameDeltas: number[]): {
	avgFrameMs: number;
	p95FrameMs: number;
	effectiveFps: number;
	jankPct: number;
} {
	if (frameDeltas.length === 0) {
		return {
			avgFrameMs: 0,
			p95FrameMs: 0,
			effectiveFps: 0,
			jankPct: 0,
		};
	}

	const avgFrameMs =
		frameDeltas.reduce((sum, delta) => sum + delta, 0) / frameDeltas.length;
	const p95FrameMs = percentile(frameDeltas, 0.95);
	const effectiveFps = avgFrameMs > 0 ? 1000 / avgFrameMs : 0;
	const jankCount = frameDeltas.filter(
		(delta) => delta > BENCHMARK_JANK_FRAME_THRESHOLD_MS,
	).length;

	return {
		avgFrameMs,
		p95FrameMs,
		effectiveFps,
		jankPct: (jankCount / frameDeltas.length) * 100,
	};
}
