import { router, useLocalSearchParams } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	BENCHMARK_CAVEAT_NOTE,
	BENCHMARK_CYCLES,
	BENCHMARK_TRANSITION_DURATION_MS,
	BENCHMARK_TRANSPARENCY_NOTE,
} from "@/components/benchmark/constants";
import {
	buildBenchmarkPath,
	useResolvedBenchmarkImpl,
	useResolvedBenchmarkScenario,
} from "@/components/benchmark/impl-routing";
import { useBenchmarkStore } from "@/components/benchmark/store";
import type { BenchmarkStackImpl } from "@/components/benchmark/types";
import { ScreenHeader } from "@/components/screen-header";

const formatMs = (value: number) => `${value.toFixed(2)}ms`;

const getImplLabel = (impl: BenchmarkStackImpl) =>
	impl === "blank-stack" ? "Blank Stack" : "JS Stack";

const getScenarioLabel = (scenario: string) =>
	scenario === "navigate-during-close"
		? "Navigate During Close"
		: "Push/Pop Loop";

const getParamValue = (
	value: string | string[] | undefined,
): string | undefined => {
	if (!value) return undefined;
	return Array.isArray(value) ? value[0] : value;
};

export default function BenchmarkControllerScreen() {
	const impl = useResolvedBenchmarkImpl();
	const scenario = useResolvedBenchmarkScenario();
	const isFocused = useIsFocused();
	const params = useLocalSearchParams<{
		autorun?: string | string[];
		returnTo?: string | string[];
	}>();

	const activeRun = useBenchmarkStore((state) => state.activeRun);
	const result = useBenchmarkStore(
		(state) => state.resultsByScenarioImpl[scenario][impl],
	);
	const beginRun = useBenchmarkStore((state) => state.beginRun);
	const recordPushDispatch = useBenchmarkStore(
		(state) => state.recordPushDispatch,
	);
	const completeCycleOnFocus = useBenchmarkStore(
		(state) => state.completeCycleOnFocus,
	);
	const finishRun = useBenchmarkStore((state) => state.finishRun);
	const abortRun = useBenchmarkStore((state) => state.abortRun);

	const autoStartedRef = useRef(false);
	const autoReturnedRef = useRef(false);
	const autoRunIdRef = useRef<string | null>(null);
	const pendingCompletionRetryRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const cycleLaunchRetriesRef = useRef<Record<string, number>>({});

	const autorunParam = getParamValue(params.autorun);
	const shouldAutoRun =
		autorunParam === "1" || autorunParam?.toLowerCase() === "true";
	const returnToParam = getParamValue(params.returnTo);
	const returnToPath =
		returnToParam && returnToParam.startsWith("/")
			? (returnToParam as `/${string}`)
			: ("/stack-benchmark" as const);

	const runForThisContext =
		activeRun &&
		activeRun.impl === impl &&
		activeRun.scenario === scenario
			? activeRun
			: null;
	const isBusyWithAnotherRun = activeRun !== null && !runForThisContext;

	const launchCycle = useCallback(
		(runId: string, cycle: number) => {
			recordPushDispatch(runId, cycle, performance.now());
			const runPath = buildBenchmarkPath(
				impl,
				`run?runId=${encodeURIComponent(runId)}&cycle=${cycle}&scenario=${scenario}`,
			);
			router.push(runPath as never);
		},
		[impl, recordPushDispatch, scenario],
	);

	const handleRun = useCallback(() => {
		if (activeRun) return;
		const runId = beginRun(impl, scenario);
		autoRunIdRef.current = runId;
		launchCycle(runId, 1);
	}, [activeRun, beginRun, impl, launchCycle, scenario]);

	const handleCancel = useCallback(() => {
		if (!runForThisContext) return;
		abortRun(runForThisContext.id);
	}, [abortRun, runForThisContext]);

	useEffect(() => {
		if (!runForThisContext) return;
		if (runForThisContext.pendingReturnCycle === null) return;
		if (!isFocused) return;

		let cancelled = false;

		const clearPendingRetry = () => {
			if (pendingCompletionRetryRef.current !== null) {
				clearTimeout(pendingCompletionRetryRef.current);
				pendingCompletionRetryRef.current = null;
			}
		};

		const tryComplete = () => {
			if (cancelled) return;

			const latestRun = useBenchmarkStore.getState().activeRun;
			if (
				!latestRun ||
				latestRun.id !== runForThisContext.id ||
				latestRun.impl !== impl ||
				latestRun.scenario !== scenario
			) {
				return;
			}

			const completion = completeCycleOnFocus(latestRun.id, performance.now());
			if (!completion.completedCycle) {
				clearPendingRetry();
				pendingCompletionRetryRef.current = setTimeout(tryComplete, 100);
				return;
			}

			clearPendingRetry();
			if (completion.done) {
				finishRun(latestRun.id);
				return;
			}

			launchCycle(latestRun.id, completion.completedCycle + 1);
		};

		tryComplete();

		return () => {
			cancelled = true;
			clearPendingRetry();
		};
	}, [completeCycleOnFocus, finishRun, isFocused, launchCycle, runForThisContext]);

	useEffect(() => {
		if (!runForThisContext) return;
		if (!isFocused) return;

		const interval = setInterval(() => {
			const latestRun = useBenchmarkStore.getState().activeRun;
			if (
				!latestRun ||
				latestRun.id !== runForThisContext.id ||
				latestRun.impl !== impl ||
				latestRun.scenario !== scenario
			) {
				return;
			}

			if (latestRun.pendingReturnCycle !== null) return;

			const cycle = latestRun.currentCycle;
			if (cycle <= 0 || cycle <= latestRun.completedCycles) return;

			const record = latestRun.cycleRecords[cycle];
			if (!record?.pushDispatchAt) return;

			const elapsedMs = performance.now() - record.pushDispatchAt;
			if (elapsedMs < BENCHMARK_TRANSITION_DURATION_MS + 260) return;

			if (
				record.pushMountedAt !== undefined &&
				record.popDispatchAt !== undefined
			) {
				return;
			}

			const retryKey = `${latestRun.id}:${cycle}`;
			const retries = cycleLaunchRetriesRef.current[retryKey] ?? 0;
			if (retries >= 2) return;

			cycleLaunchRetriesRef.current[retryKey] = retries + 1;
			launchCycle(latestRun.id, cycle);
		}, 260);

		return () => {
			clearInterval(interval);
		};
	}, [impl, isFocused, launchCycle, runForThisContext, scenario]);

	useEffect(() => {
		if (runForThisContext) return;
		cycleLaunchRetriesRef.current = {};
	}, [runForThisContext]);

	useEffect(() => {
		if (!shouldAutoRun) return;
		if (autoStartedRef.current) return;
		if (activeRun !== null) return;

		autoStartedRef.current = true;
		const runId = beginRun(impl, scenario);
		autoRunIdRef.current = runId;
		launchCycle(runId, 1);
	}, [activeRun, beginRun, impl, launchCycle, scenario, shouldAutoRun]);

	useEffect(() => {
		if (!shouldAutoRun || !autoStartedRef.current) return;
		if (autoReturnedRef.current) return;
		if (!result) return;
		if (activeRun?.impl === impl && activeRun.scenario === scenario) return;
		if (result.runId !== autoRunIdRef.current) return;

		autoReturnedRef.current = true;
		router.replace(returnToPath as never);
	}, [
		activeRun,
		impl,
		result,
		returnToPath,
		scenario,
		shouldAutoRun,
	]);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title={`${getImplLabel(impl)} • ${getScenarioLabel(scenario)}`}
				subtitle={`${BENCHMARK_CYCLES}-cycle automated run`}
			/>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.noticeCard}>
					<Text style={styles.noticeTitle}>Transparency</Text>
					<Text style={styles.noticeText}>{BENCHMARK_TRANSPARENCY_NOTE}</Text>
					<Text style={styles.noticeSubtext}>{BENCHMARK_CAVEAT_NOTE}</Text>
				</View>

				<View style={styles.controlsCard}>
					<Text style={styles.controlsTitle}>Run Status</Text>
					{runForThisContext ? (
						<Text style={styles.statusText}>
							Running cycle {Math.max(1, runForThisContext.currentCycle)}/
							{runForThisContext.totalCycles} • completed{" "}
							{runForThisContext.completedCycles}/{BENCHMARK_CYCLES}
						</Text>
					) : isBusyWithAnotherRun ? (
						<Text style={styles.statusText}>
							Another benchmark run is currently in progress.
						</Text>
					) : result ? (
						<Text style={styles.statusText}>
							Complete • run #{result.runIndex} • {result.buildMode} mode.
						</Text>
					) : (
						<Text style={styles.statusText}>
							Ready. Tap Run to execute {BENCHMARK_CYCLES} cycles.
						</Text>
					)}

					<Pressable
						testID={`benchmark-run-${impl}-${scenario}`}
						style={[styles.button, activeRun !== null && styles.buttonDisabled]}
						disabled={activeRun !== null}
						onPress={handleRun}
					>
						<Text style={styles.buttonText}>Run Benchmark</Text>
					</Pressable>

					{runForThisContext ? (
						<Pressable style={styles.secondaryButton} onPress={handleCancel}>
							<Text style={styles.secondaryButtonText}>Cancel Current Run</Text>
						</Pressable>
					) : null}
				</View>

				{result ? (
					<View style={styles.resultCard}>
						<Text style={styles.resultTitle}>Latest Result</Text>
						<Text style={styles.metric}>
							Push mean {formatMs(result.pushLatencyMs.mean)} · p95{" "}
							{formatMs(result.pushLatencyMs.p95)}
						</Text>
						<Text style={styles.metric}>
							Pop mean {formatMs(result.popLatencyMs.mean)} · p95{" "}
							{formatMs(result.popLatencyMs.p95)}
						</Text>
						<Text style={styles.metric}>
							Cycle mean {formatMs(result.cycleDurationMs.mean)} · p95{" "}
							{formatMs(result.cycleDurationMs.p95)}
						</Text>
						<Text style={styles.metric}>
							JS-loop frame delta mean {formatMs(result.avgFrameMs)} · p95{" "}
							{formatMs(result.p95FrameMs)}
						</Text>
					</View>
				) : null}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0b1220",
	},
	content: {
		padding: 16,
		paddingBottom: 40,
		gap: 12,
	},
	noticeCard: {
		backgroundColor: "#101b2e",
		padding: 14,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#22344d",
	},
	noticeTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: "#f1f5f9",
		marginBottom: 6,
	},
	noticeText: {
		fontSize: 13,
		color: "#d1d9e7",
		lineHeight: 19,
	},
	noticeSubtext: {
		fontSize: 12,
		color: "#9aaac4",
		marginTop: 8,
	},
	controlsCard: {
		backgroundColor: "#101b2e",
		padding: 14,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#22344d",
		gap: 10,
	},
	controlsTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: "#f1f5f9",
	},
	statusText: {
		fontSize: 13,
		color: "#d1d9e7",
		lineHeight: 18,
	},
	button: {
		backgroundColor: "#0ea5e9",
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: "center",
	},
	buttonDisabled: {
		opacity: 0.45,
	},
	buttonText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fff",
	},
	secondaryButton: {
		backgroundColor: "rgba(255,255,255,0.08)",
		paddingVertical: 10,
		borderRadius: 10,
		alignItems: "center",
	},
	secondaryButtonText: {
		fontSize: 13,
		fontWeight: "600",
		color: "#e5e7eb",
	},
	resultCard: {
		backgroundColor: "#101b2e",
		padding: 14,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#22344d",
		gap: 6,
	},
	resultTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: "#f1f5f9",
		marginBottom: 4,
	},
	metric: {
		fontSize: 12,
		color: "#d1d9e7",
		fontFamily: "monospace",
	},
});
