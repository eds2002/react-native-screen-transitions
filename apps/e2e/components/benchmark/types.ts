export type BenchmarkStackImpl = "blank-stack" | "js-stack";
export type BenchmarkScenario = "push-pop-loop" | "navigate-during-close";
export type BenchmarkBuildMode = "dev" | "release";

export interface MetricSummary {
	mean: number;
	p95: number;
}

export interface BenchmarkRunResult {
	pushLatencyMs: MetricSummary;
	popLatencyMs: MetricSummary;
	cycleDurationMs: MetricSummary;
	avgFrameMs: number;
	p95FrameMs: number;
	effectiveFps: number;
	jankPct: number;
	cycles: number;
	timestamp: number;
	scenario: BenchmarkScenario;
	buildMode: BenchmarkBuildMode;
	runId: string;
	runIndex: number;
}
