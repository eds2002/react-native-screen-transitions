import type { BenchmarkScenario } from "./types";

export type BenchmarkScenarioAppearance = "opaque-card" | "transparent-card";

export interface BenchmarkDefinition {
	id: BenchmarkScenario;
	title: string;
	description: string;
	isPublic: boolean;
	appearance: BenchmarkScenarioAppearance;
	holdBeforePopMs: number;
}

export const BENCHMARK_DEFINITIONS: Record<
	BenchmarkScenario,
	BenchmarkDefinition
> = {
	"opaque-push-pop-loop": {
		id: "opaque-push-pop-loop",
		title: "Opaque Push/Pop Loop",
		description: "Baseline full-screen push/pop timing.",
		isPublic: true,
		appearance: "opaque-card",
		holdBeforePopMs: 0,
	},
	"push-pop-loop": {
		id: "push-pop-loop",
		title: "Transparent Push/Pop Loop",
		description:
			"Translucent push/pop timing with the previous screen kept visible.",
		isPublic: true,
		appearance: "transparent-card",
		holdBeforePopMs: 0,
	},
	"navigate-during-close": {
		id: "navigate-during-close",
		title: "Navigate During Close",
		description:
			"Internal regression scenario for interrupted navigation during close.",
		isPublic: false,
		appearance: "transparent-card",
		holdBeforePopMs: 0,
	},
};

export const ALL_BENCHMARK_SCENARIOS = Object.keys(
	BENCHMARK_DEFINITIONS,
) as BenchmarkScenario[];

export const PUBLIC_BENCHMARKS = ALL_BENCHMARK_SCENARIOS.map(
	(id) => BENCHMARK_DEFINITIONS[id],
).filter((definition) => definition.isPublic);

export function getBenchmarkDefinition(
	scenario: BenchmarkScenario,
): BenchmarkDefinition {
	return BENCHMARK_DEFINITIONS[scenario];
}

export function buildBenchmarkDashboardPath(
	scenario: BenchmarkScenario,
): `/${string}` {
	return `/stack-benchmark/${scenario}` as `/${string}`;
}
