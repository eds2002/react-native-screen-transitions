import { useLocalSearchParams, useSegments } from "expo-router";
import type { BenchmarkScenario, BenchmarkStackImpl } from "./types";

const BENCHMARK_IMPLS: readonly BenchmarkStackImpl[] = [
	"blank-stack",
	"js-stack",
];
const BENCHMARK_SCENARIOS: readonly BenchmarkScenario[] = [
	"push-pop-loop",
	"navigate-during-close",
];

export function resolveBenchmarkImpl(
	value: unknown,
): BenchmarkStackImpl | null {
	if (typeof value !== "string") return null;
	return BENCHMARK_IMPLS.includes(value as BenchmarkStackImpl)
		? (value as BenchmarkStackImpl)
		: null;
}

export function useResolvedBenchmarkImpl(): BenchmarkStackImpl {
	const params = useLocalSearchParams<{ impl?: string | string[] }>();
	const segments = useSegments();

	const paramValue = Array.isArray(params.impl) ? params.impl[0] : params.impl;
	const fromParam = resolveBenchmarkImpl(paramValue);
	if (fromParam) return fromParam;

	for (const segment of segments) {
		const resolved = resolveBenchmarkImpl(segment);
		if (resolved) return resolved;
	}

	return "blank-stack";
}

export function resolveBenchmarkScenario(
	value: unknown,
): BenchmarkScenario | null {
	if (typeof value !== "string") return null;
	return BENCHMARK_SCENARIOS.includes(value as BenchmarkScenario)
		? (value as BenchmarkScenario)
		: null;
}

export function useResolvedBenchmarkScenario(): BenchmarkScenario {
	const params = useLocalSearchParams<{ scenario?: string | string[] }>();
	const value = Array.isArray(params.scenario)
		? params.scenario[0]
		: params.scenario;
	return resolveBenchmarkScenario(value) ?? "push-pop-loop";
}

export function buildBenchmarkPath(
	impl: BenchmarkStackImpl,
	childPath = "",
): `/${string}` {
	const normalized = childPath.replace(/^\/+/, "");
	return (`/stack-benchmark/${impl}${normalized ? `/${normalized}` : ""}`) as `/${string}`;
}
