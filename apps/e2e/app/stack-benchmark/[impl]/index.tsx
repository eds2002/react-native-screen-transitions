import { useIsFocused } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
	InteractionManager,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
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
import { getBenchmarkDefinition } from "@/components/benchmark/scenarios";
import { useBenchmarkStore } from "@/components/benchmark/store";
import type { BenchmarkStackImpl } from "@/components/benchmark/types";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

const formatMs = (value: number) => `${value.toFixed(2)}ms`;

const getImplLabel = (impl: BenchmarkStackImpl) =>
	impl === "blank-stack" ? "Blank Stack" : "JS Stack";

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
	const theme = useTheme();
	const definition = getBenchmarkDefinition(scenario);
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
	const pendingCompletionRetryRef = useRef<ReturnType<
		typeof setTimeout
	> | null>(null);
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
		activeRun && activeRun.impl === impl && activeRun.scenario === scenario
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
		let interactionTask: ReturnType<
			typeof InteractionManager.runAfterInteractions
		> | null = null;
		let completionFrameHandle: number | null = null;

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

		interactionTask = InteractionManager.runAfterInteractions(() => {
			if (cancelled) return;
			completionFrameHandle = requestAnimationFrame(() => {
				tryComplete();
			});
		});

		return () => {
			cancelled = true;
			clearPendingRetry();
			interactionTask?.cancel();
			if (completionFrameHandle !== null) {
				cancelAnimationFrame(completionFrameHandle);
			}
		};
	}, [
		completeCycleOnFocus,
		finishRun,
		impl,
		isFocused,
		launchCycle,
		runForThisContext,
		scenario,
	]);

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
	}, [activeRun, impl, result, returnToPath, scenario, shouldAutoRun]);

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title={`${getImplLabel(impl)} • ${definition.title}`}
				subtitle={`${BENCHMARK_CYCLES}-cycle automated run`}
			/>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={[styles.noticeCard, { backgroundColor: theme.card }]}>
					<Text style={[styles.noticeTitle, { color: theme.text }]}>
						Transparency
					</Text>
					<Text style={[styles.noticeText, { color: theme.textSecondary }]}>
						{BENCHMARK_TRANSPARENCY_NOTE}
					</Text>
					<Text style={[styles.noticeSubtext, { color: theme.textTertiary }]}>
						{BENCHMARK_CAVEAT_NOTE}
					</Text>
				</View>

				<View style={[styles.controlsCard, { backgroundColor: theme.card }]}>
					<Text style={[styles.controlsTitle, { color: theme.text }]}>
						Run Status
					</Text>
					{runForThisContext ? (
						<Text style={[styles.statusText, { color: theme.textSecondary }]}>
							Running cycle {Math.max(1, runForThisContext.currentCycle)}/
							{runForThisContext.totalCycles} • completed{" "}
							{runForThisContext.completedCycles}/{BENCHMARK_CYCLES}
						</Text>
					) : isBusyWithAnotherRun ? (
						<Text style={[styles.statusText, { color: theme.textSecondary }]}>
							Another benchmark run is currently in progress.
						</Text>
					) : result ? (
						<Text style={[styles.statusText, { color: theme.textSecondary }]}>
							Complete • run #{result.runIndex} • {result.buildMode} mode.
						</Text>
					) : (
						<Text style={[styles.statusText, { color: theme.textSecondary }]}>
							Ready. Tap Run to execute {BENCHMARK_CYCLES} cycles.
						</Text>
					)}

					<Pressable
						testID={`benchmark-run-${impl}-${scenario}`}
						style={({ pressed }) => [
							styles.button,
							{
								backgroundColor: pressed
									? theme.actionButtonPressed
									: theme.actionButton,
							},
							activeRun !== null && styles.buttonDisabled,
						]}
						disabled={activeRun !== null}
						onPress={handleRun}
					>
						<Text
							style={[styles.buttonText, { color: theme.actionButtonText }]}
						>
							Run Benchmark
						</Text>
					</Pressable>

					{runForThisContext ? (
						<Pressable
							style={({ pressed }) => [
								styles.secondaryButton,
								{
									backgroundColor: pressed
										? theme.secondaryButtonPressed
										: theme.secondaryButton,
								},
							]}
							onPress={handleCancel}
						>
							<Text
								style={[
									styles.secondaryButtonText,
									{ color: theme.secondaryButtonText },
								]}
							>
								Cancel Current Run
							</Text>
						</Pressable>
					) : null}
				</View>

				{result ? (
					<View style={[styles.resultCard, { backgroundColor: theme.card }]}>
						<Text style={[styles.resultTitle, { color: theme.text }]}>
							Latest Result
						</Text>
						<Text style={[styles.metric, { color: theme.textSecondary }]}>
							Push mean {formatMs(result.pushLatencyMs.mean)} · p95{" "}
							{formatMs(result.pushLatencyMs.p95)}
						</Text>
						<Text style={[styles.metric, { color: theme.textSecondary }]}>
							Pop mean {formatMs(result.popLatencyMs.mean)} · p95{" "}
							{formatMs(result.popLatencyMs.p95)}
						</Text>
						<Text style={[styles.metric, { color: theme.textSecondary }]}>
							Cycle mean {formatMs(result.cycleDurationMs.mean)} · p95{" "}
							{formatMs(result.cycleDurationMs.p95)}
						</Text>
						<Text style={[styles.metric, { color: theme.textSecondary }]}>
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
	},
	content: {
		padding: 16,
		paddingBottom: 40,
		gap: 12,
	},
	noticeCard: {
		padding: 14,
		borderRadius: 14,
	},
	noticeTitle: {
		fontSize: 15,
		fontWeight: "700",
		marginBottom: 6,
	},
	noticeText: {
		fontSize: 13,
		lineHeight: 19,
	},
	noticeSubtext: {
		fontSize: 12,
		marginTop: 8,
	},
	controlsCard: {
		padding: 14,
		borderRadius: 14,
		gap: 10,
	},
	controlsTitle: {
		fontSize: 15,
		fontWeight: "700",
	},
	statusText: {
		fontSize: 13,
		lineHeight: 18,
	},
	button: {
		paddingVertical: 12,
		borderRadius: 999,
		alignItems: "center",
	},
	buttonDisabled: {
		opacity: 0.45,
	},
	buttonText: {
		fontSize: 14,
		fontWeight: "700",
	},
	secondaryButton: {
		paddingVertical: 10,
		borderRadius: 999,
		alignItems: "center",
	},
	secondaryButtonText: {
		fontSize: 13,
		fontWeight: "600",
	},
	resultCard: {
		padding: 14,
		borderRadius: 14,
		gap: 6,
	},
	resultTitle: {
		fontSize: 15,
		fontWeight: "700",
		marginBottom: 4,
	},
	metric: {
		fontSize: 12,
		fontFamily: "monospace",
	},
});
