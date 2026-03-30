import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	BENCHMARK_CAVEAT_NOTE,
	BENCHMARK_CYCLES,
	BENCHMARK_EFFECT_SIZE_MIN_PCT,
	BENCHMARK_FAIR_RUNS_PER_IMPL,
	BENCHMARK_MIN_RUNS_FOR_PRELIMINARY,
	BENCHMARK_ON_PAR_THRESHOLD_PCT,
	BENCHMARK_RECOMMENDED_RUNS_PER_IMPL,
	BENCHMARK_TRANSPARENCY_NOTE,
} from "@/components/benchmark/constants";
import { buildBenchmarkPath } from "@/components/benchmark/impl-routing";
import {
	useBenchmarkStore,
	type FairRunStep,
} from "@/components/benchmark/store";
import {
	buildBenchmarkDashboardPath,
	getBenchmarkDefinition,
} from "@/components/benchmark/scenarios";
import type {
	BenchmarkRunResult,
	BenchmarkScenario,
	BenchmarkStackImpl,
} from "@/components/benchmark/types";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

type Confidence = "Low" | "Medium" | "High";

interface ScenarioSummary {
	fasterImpl: BenchmarkStackImpl | null;
	speedPct: number;
	cycleMedianBlank: number;
	cycleMedianJs: number;
	cycleDeltaPct: number;
	confidence: Confidence;
	confidenceReason: string;
	blankRuns: number;
	jsRuns: number;
}

const formatMs = (value: number) => `${value.toFixed(2)}ms`;
const formatDeltaPct = (value: number) =>
	`${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

const getImplLabel = (impl: BenchmarkStackImpl) =>
	impl === "blank-stack" ? "Blank Stack" : "JS Stack";

const median = (values: number[]) => {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0
		? (sorted[mid - 1] + sorted[mid]) / 2
		: sorted[mid];
};

const safeDeltaPct = (value: number, baseline: number) => {
	if (baseline === 0) return 0;
	return ((value - baseline) / baseline) * 100;
};

function buildScenarioSummary(
	blankHistory: BenchmarkRunResult[],
	jsHistory: BenchmarkRunResult[],
): ScenarioSummary | null {
	if (blankHistory.length === 0 || jsHistory.length === 0) return null;

	const blankCycles = blankHistory.map((item) => item.cycleDurationMs.mean);
	const jsCycles = jsHistory.map((item) => item.cycleDurationMs.mean);

	const cycleMedianBlank = median(blankCycles);
	const cycleMedianJs = median(jsCycles);
	const cycleDeltaPct = safeDeltaPct(cycleMedianBlank, cycleMedianJs);

	const blankRuns = blankHistory.length;
	const jsRuns = jsHistory.length;
	const runsPerImpl = Math.min(blankRuns, jsRuns);

	const isTie = cycleMedianBlank === cycleMedianJs;
	const fasterImpl: BenchmarkStackImpl | null = isTie
		? null
		: cycleMedianBlank < cycleMedianJs
			? "blank-stack"
			: "js-stack";
	const fasterValue =
		fasterImpl === "blank-stack" ? cycleMedianBlank : cycleMedianJs;
	const slowerValue =
		fasterImpl === "blank-stack" ? cycleMedianJs : cycleMedianBlank;
	const speedPct =
		isTie || slowerValue <= 0
			? 0
			: ((slowerValue - fasterValue) / slowerValue) * 100;

	let confidence: Confidence = "Low";
	let confidenceReason = "Need more runs on both stacks.";
	if (__DEV__) {
		confidence = "Low";
		confidenceReason =
			"Dev mode timings are noisy; confidence is capped at Low.";
	} else if (
		runsPerImpl >= BENCHMARK_MIN_RUNS_FOR_PRELIMINARY &&
		speedPct < BENCHMARK_ON_PAR_THRESHOLD_PCT
	) {
		confidence =
			runsPerImpl >= BENCHMARK_RECOMMENDED_RUNS_PER_IMPL ? "High" : "Medium";
		confidenceReason = `Median cycle delta stayed within ${BENCHMARK_ON_PAR_THRESHOLD_PCT}% across both stacks.`;
	} else if (runsPerImpl < BENCHMARK_MIN_RUNS_FOR_PRELIMINARY) {
		confidence = "Low";
		confidenceReason = `Need at least ${BENCHMARK_MIN_RUNS_FOR_PRELIMINARY} runs per stack.`;
	} else if (speedPct < BENCHMARK_EFFECT_SIZE_MIN_PCT) {
		confidence = "Low";
		confidenceReason = `Effect size is below ${BENCHMARK_EFFECT_SIZE_MIN_PCT}% for this benchmark.`;
	} else if (runsPerImpl < BENCHMARK_RECOMMENDED_RUNS_PER_IMPL) {
		confidence = "Medium";
		confidenceReason = `Preliminary confidence: ${BENCHMARK_RECOMMENDED_RUNS_PER_IMPL}+ runs per stack gives High confidence.`;
	} else {
		confidence = "High";
		confidenceReason = "Run count and effect size meet thresholds.";
	}

	return {
		fasterImpl,
		speedPct,
		cycleMedianBlank,
		cycleMedianJs,
		cycleDeltaPct,
		confidence,
		confidenceReason,
		blankRuns,
		jsRuns,
	};
}

function isOnParSummary(summary: ScenarioSummary) {
	const runsPerImpl = Math.min(summary.blankRuns, summary.jsRuns);
	return (
		!__DEV__ &&
		runsPerImpl >= BENCHMARK_MIN_RUNS_FOR_PRELIMINARY &&
		summary.speedPct < BENCHMARK_ON_PAR_THRESHOLD_PCT
	);
}

function getSummaryHeading(summary: ScenarioSummary) {
	if (__DEV__) {
		return "Dev snapshot only";
	}
	if (isOnParSummary(summary)) {
		return "On par for this benchmark";
	}
	if (summary.confidence === "Low") {
		return "Early read only";
	}
	return "Winner for this benchmark";
}

function getSummaryHeadline(summary: ScenarioSummary) {
	if (__DEV__) {
		return "No publishable leader in dev mode";
	}
	if (isOnParSummary(summary)) {
		return "Blank Stack and JS Stack are on par";
	}
	if (summary.confidence === "Low") {
		return "No publishable leader yet";
	}
	if (!summary.fasterImpl) {
		return "Tie";
	}
	return `${getImplLabel(summary.fasterImpl)} (${summary.speedPct.toFixed(2)}% faster)`;
}

function getOnParDifferenceText(summary: ScenarioSummary) {
	if (!isOnParSummary(summary) || !summary.fasterImpl) return null;

	const fasterValue =
		summary.fasterImpl === "blank-stack"
			? summary.cycleMedianBlank
			: summary.cycleMedianJs;
	const slowerValue =
		summary.fasterImpl === "blank-stack"
			? summary.cycleMedianJs
			: summary.cycleMedianBlank;
	const deltaMs = Math.abs(slowerValue - fasterValue);

	return `${getImplLabel(summary.fasterImpl)} still led by ${formatMs(deltaMs)} (${summary.speedPct.toFixed(2)}%).`;
}

function MetricLine({ label, value }: { label: string; value: string }) {
	const theme = useTheme();

	return (
		<View style={styles.metricLine}>
			<Text style={[styles.metricLabel, { color: theme.textTertiary }]}>
				{label}
			</Text>
			<Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
		</View>
	);
}

function LatestResultCard({
	impl,
	result,
	runCount,
	disabled,
	isRunning,
	onRun,
}: {
	impl: BenchmarkStackImpl;
	result: BenchmarkRunResult | undefined;
	runCount: number;
	disabled: boolean;
	isRunning: boolean;
	onRun: (impl: BenchmarkStackImpl) => void;
}) {
	const theme = useTheme();

	return (
		<View style={[styles.implCard, { backgroundColor: theme.surfaceElevated }]}>
			<View style={styles.implHeader}>
				<Text style={[styles.implTitle, { color: theme.text }]}>
					{getImplLabel(impl)}
				</Text>
				<Text style={[styles.implRuns, { color: theme.textTertiary }]}>
					Runs: {runCount}
				</Text>
			</View>

			<Pressable
				testID={`benchmark-run-${impl}`}
				style={({ pressed }) => [
					styles.runButton,
					{
						backgroundColor: pressed
							? theme.actionButtonPressed
							: theme.actionButton,
					},
					disabled && styles.runButtonDisabled,
				]}
				disabled={disabled}
				onPress={() => onRun(impl)}
			>
				<Text style={[styles.runButtonText, { color: theme.actionButtonText }]}>
					{isRunning ? "Running..." : `Run ${BENCHMARK_CYCLES}-Cycle Benchmark`}
				</Text>
			</Pressable>

			{result ? (
				<View style={styles.implMetrics}>
					<MetricLine
						label="Push mean (last run)"
						value={formatMs(result.pushLatencyMs.mean)}
					/>
					<MetricLine
						label="Pop mean (last run)"
						value={formatMs(result.popLatencyMs.mean)}
					/>
					<MetricLine
						label="Cycle mean (last run)"
						value={formatMs(result.cycleDurationMs.mean)}
					/>
					<MetricLine
						label="JS loop delta (last run)"
						value={formatMs(result.avgFrameMs)}
					/>
				</View>
			) : (
				<Text style={[styles.emptyText, { color: theme.textTertiary }]}>
					No result captured for this stack yet.
				</Text>
			)}
		</View>
	);
}

export function BenchmarkScenarioDashboard({
	scenario,
}: {
	scenario: BenchmarkScenario;
}) {
	const isFocused = useIsFocused();
	const theme = useTheme();
	const definition = getBenchmarkDefinition(scenario);
	const returnToPath = buildBenchmarkDashboardPath(scenario);
	const activeRun = useBenchmarkStore((state) => state.activeRun);
	const fairRunPlan = useBenchmarkStore((state) => state.fairRunPlan);
	const resultsByScenarioImpl = useBenchmarkStore(
		(state) => state.resultsByScenarioImpl,
	);
	const historyByScenarioImpl = useBenchmarkStore(
		(state) => state.historyByScenarioImpl,
	);
	const startFairRun = useBenchmarkStore((state) => state.startFairRun);
	const consumeNextFairRunStep = useBenchmarkStore(
		(state) => state.consumeNextFairRunStep,
	);
	const cancelFairRun = useBenchmarkStore((state) => state.cancelFairRun);
	const clearScenarioResults = useBenchmarkStore(
		(state) => state.clearScenarioResults,
	);
	const pendingFairStepRef = useRef<FairRunStep | null>(null);
	const fairRunLaunchAttemptRef = useRef(0);
	const fairRunRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	const clearFairRunRetryTimeout = useCallback(() => {
		if (fairRunRetryTimeoutRef.current !== null) {
			clearTimeout(fairRunRetryTimeoutRef.current);
			fairRunRetryTimeoutRef.current = null;
		}
	}, []);

	const runBenchmark = useCallback(
		(impl: BenchmarkStackImpl) => {
			if (activeRun || fairRunPlan) return;
			const basePath = buildBenchmarkPath(impl);
			const path = `${basePath}?scenario=${scenario}&autorun=1&returnTo=${encodeURIComponent(returnToPath)}`;
			router.replace(path as never);
		},
		[activeRun, fairRunPlan, returnToPath, scenario],
	);

	const launchFairStep = useCallback(
		(step: FairRunStep) => {
			fairRunLaunchAttemptRef.current += 1;
			const attempt = fairRunLaunchAttemptRef.current;
			if (attempt > 4) {
				pendingFairStepRef.current = null;
				fairRunLaunchAttemptRef.current = 0;
				clearFairRunRetryTimeout();
				cancelFairRun();
				return;
			}

			const basePath = buildBenchmarkPath(step.impl);
			const path = `${basePath}?scenario=${step.scenario}&autorun=1&returnTo=${encodeURIComponent(returnToPath)}&fairStep=${step.stepIndex}&fairTry=${attempt}`;
			router.replace(path as never);

			clearFairRunRetryTimeout();
			fairRunRetryTimeoutRef.current = setTimeout(() => {
				const pendingStep = pendingFairStepRef.current;
				if (!pendingStep || pendingStep.stepIndex !== step.stepIndex) return;

				const latestState = useBenchmarkStore.getState();
				const started =
					latestState.activeRun &&
					latestState.activeRun.impl === step.impl &&
					latestState.activeRun.scenario === step.scenario;
				if (started || !latestState.fairRunPlan) return;

				launchFairStep(step);
			}, 1200);
		},
		[cancelFairRun, clearFairRunRetryTimeout, returnToPath],
	);

	const handleStartFairRun = useCallback(() => {
		if (activeRun || fairRunPlan) return;
		startFairRun([scenario], BENCHMARK_FAIR_RUNS_PER_IMPL);
	}, [activeRun, fairRunPlan, scenario, startFairRun]);

	const handleCancelFairRun = useCallback(() => {
		pendingFairStepRef.current = null;
		fairRunLaunchAttemptRef.current = 0;
		clearFairRunRetryTimeout();
		cancelFairRun();
	}, [cancelFairRun, clearFairRunRetryTimeout]);

	useEffect(() => {
		if (!fairRunPlan) {
			pendingFairStepRef.current = null;
			fairRunLaunchAttemptRef.current = 0;
			clearFairRunRetryTimeout();
		}
	}, [clearFairRunRetryTimeout, fairRunPlan]);

	useEffect(() => {
		const pendingStep = pendingFairStepRef.current;
		if (!pendingStep || !activeRun) return;

		if (
			activeRun.impl === pendingStep.impl &&
			activeRun.scenario === pendingStep.scenario
		) {
			pendingFairStepRef.current = null;
			fairRunLaunchAttemptRef.current = 0;
			clearFairRunRetryTimeout();
		}
	}, [activeRun, clearFairRunRetryTimeout]);

	useEffect(() => {
		if (!isFocused) return;
		if (activeRun) return;
		if (!fairRunPlan) return;
		if (pendingFairStepRef.current) return;

		const step = consumeNextFairRunStep();
		if (!step) return;

		pendingFairStepRef.current = step;
		fairRunLaunchAttemptRef.current = 0;
		launchFairStep(step);
	}, [
		isFocused,
		activeRun,
		fairRunPlan,
		consumeNextFairRunStep,
		launchFairStep,
	]);

	useEffect(
		() => () => {
			clearFairRunRetryTimeout();
		},
		[clearFairRunRetryTimeout],
	);

	const statusText = useMemo(() => {
		if (fairRunPlan && !activeRun) {
			return `Comparison queue ready • step ${Math.min(
				fairRunPlan.nextStepIndex + 1,
				fairRunPlan.steps.length,
			)}/${fairRunPlan.steps.length}`;
		}
		if (!activeRun) return "Idle";
		return `Running ${getImplLabel(activeRun.impl)} • cycle ${Math.max(
			1,
			activeRun.currentCycle,
		)}/${activeRun.totalCycles}`;
	}, [activeRun, fairRunPlan]);

	const fairRunProgressText = useMemo(() => {
		if (!fairRunPlan) return null;
		const launchedSteps = fairRunPlan.nextStepIndex;
		const totalSteps = fairRunPlan.steps.length;
		const nextStep = fairRunPlan.steps[fairRunPlan.nextStepIndex];
		if (!nextStep) {
			return `Auto alternating in progress • ${launchedSteps}/${totalSteps} steps launched.`;
		}
		return `Auto alternating in progress • ${launchedSteps}/${totalSteps} launched • next ${getImplLabel(nextStep.impl)}`;
	}, [fairRunPlan]);

	const blankHistory = historyByScenarioImpl[scenario]["blank-stack"];
	const jsHistory = historyByScenarioImpl[scenario]["js-stack"];
	const blankResult = resultsByScenarioImpl[scenario]["blank-stack"];
	const jsResult = resultsByScenarioImpl[scenario]["js-stack"];
	const summary = useMemo(
		() => buildScenarioSummary(blankHistory, jsHistory),
		[blankHistory, jsHistory],
	);
	const onParDifferenceText = useMemo(
		() => (summary ? getOnParDifferenceText(summary) : null),
		[summary],
	);

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader title={definition.title} subtitle={definition.description} />
			<ScrollView contentContainerStyle={styles.content}>
				<View style={[styles.headerCard, { backgroundColor: theme.card }]}>
					<Text style={[styles.headerTitle, { color: theme.text }]}>
						Focused Benchmark
					</Text>
					<Text style={[styles.headerBody, { color: theme.textSecondary }]}>
						{BENCHMARK_TRANSPARENCY_NOTE}
					</Text>
					<Text style={[styles.headerMuted, { color: theme.textTertiary }]}>
						{BENCHMARK_CAVEAT_NOTE}
					</Text>
					<View
						style={[
							styles.statusRow,
							{ borderTopColor: theme.separator },
						]}
					>
						<Text style={[styles.statusLabel, { color: theme.textTertiary }]}>
							Status
						</Text>
						<Text style={[styles.statusValue, { color: theme.text }]}>
							{statusText}
						</Text>
					</View>
				</View>

				<View style={[styles.fairRunCard, { backgroundColor: theme.card }]}>
					<Text style={[styles.fairRunTitle, { color: theme.text }]}>
						Comparison Run
					</Text>
					<Text style={[styles.fairRunBody, { color: theme.textTertiary }]}>
						Alternates Blank Stack and JS Stack for this benchmark only to
						reduce warmup and ordering bias ({BENCHMARK_FAIR_RUNS_PER_IMPL} runs
						per stack).
					</Text>
					{fairRunProgressText ? (
						<Text
							style={[styles.fairRunProgress, { color: theme.actionButton }]}
						>
							{fairRunProgressText}
						</Text>
					) : null}
					<Pressable
						testID={`benchmark-fair-run-start-${scenario}`}
						style={({ pressed }) => [
							styles.fairRunButton,
							{
								backgroundColor: pressed
									? theme.actionButtonPressed
									: theme.actionButton,
							},
							(activeRun !== null || fairRunPlan !== null) &&
								styles.runButtonDisabled,
						]}
						disabled={activeRun !== null || fairRunPlan !== null}
						onPress={handleStartFairRun}
					>
						<Text
							style={[
								styles.fairRunButtonText,
								{ color: theme.actionButtonText },
							]}
						>
							Start Comparison Run ({BENCHMARK_FAIR_RUNS_PER_IMPL} each)
						</Text>
					</Pressable>
					{fairRunPlan ? (
						<Pressable
							testID={`benchmark-fair-run-stop-${scenario}`}
							style={({ pressed }) => [
								styles.fairRunCancelButton,
								{
									backgroundColor: pressed
										? theme.secondaryButtonPressed
										: theme.secondaryButton,
								},
							]}
							onPress={handleCancelFairRun}
						>
							<Text
								style={[
									styles.fairRunCancelText,
									{ color: theme.secondaryButtonText },
								]}
							>
								Stop Comparison Queue
							</Text>
						</Pressable>
					) : null}
				</View>

				{__DEV__ ? (
					<View style={[styles.devWarningCard, { backgroundColor: theme.noteBox }]}>
						<Text style={[styles.devWarningTitle, { color: theme.noteText }]}>
							Dev Build Warning
						</Text>
						<Text style={[styles.devWarningBody, { color: theme.noteText }]}>
							Dev mode timings are noisy; confidence is capped at Low.
						</Text>
					</View>
				) : null}

				<LatestResultCard
					impl="blank-stack"
					result={blankResult}
					runCount={blankHistory.length}
					disabled={activeRun !== null || fairRunPlan !== null}
					isRunning={
						activeRun?.scenario === scenario &&
						activeRun?.impl === "blank-stack"
					}
					onRun={runBenchmark}
				/>

				<LatestResultCard
					impl="js-stack"
					result={jsResult}
					runCount={jsHistory.length}
					disabled={activeRun !== null || fairRunPlan !== null}
					isRunning={
						activeRun?.scenario === scenario && activeRun?.impl === "js-stack"
					}
					onRun={runBenchmark}
				/>

				<View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
					<Text style={[styles.summaryTitle, { color: theme.text }]}>
						Benchmark Summary
					</Text>
						{summary ? (
							<>
								<Text style={[styles.speedSummary, { color: theme.actionButton }]}>
									{getSummaryHeading(summary)}
								</Text>
								<Text style={[styles.summaryWinnerText, { color: theme.text }]}>
									{getSummaryHeadline(summary)}
								</Text>
								{onParDifferenceText ? (
									<Text
										style={[
											styles.summaryDelta,
											{ color: theme.textSecondary },
										]}
									>
										{onParDifferenceText}
									</Text>
								) : null}
							<MetricLine
								label="Median cycle time"
								value={`${formatMs(summary.cycleMedianBlank)} vs ${formatMs(summary.cycleMedianJs)} · Δ ${formatDeltaPct(summary.cycleDeltaPct)}`}
							/>
							<MetricLine
								label="Runs (blank / js)"
								value={`${summary.blankRuns} / ${summary.jsRuns}`}
							/>
							<MetricLine label="Confidence" value={summary.confidence} />
							<Text style={[styles.summaryHint, { color: theme.textTertiary }]}>
								{summary.confidenceReason}
							</Text>
						</>
					) : (
						<Text style={[styles.summaryHint, { color: theme.textTertiary }]}>
							Run both stacks in this benchmark to compare them.
						</Text>
					)}
				</View>

				<Pressable
					style={({ pressed }) => [
						styles.clearButton,
						{
							backgroundColor: pressed
								? theme.secondaryButtonPressed
								: theme.secondaryButton,
						},
						(activeRun !== null || fairRunPlan !== null) &&
							styles.runButtonDisabled,
					]}
					disabled={activeRun !== null || fairRunPlan !== null}
					onPress={() => clearScenarioResults(scenario)}
				>
					<Text
						style={[styles.clearButtonText, { color: theme.secondaryButtonText }]}
					>
						Clear Benchmark Results
					</Text>
				</Pressable>
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
		paddingBottom: 36,
		gap: 12,
	},
	headerCard: {
		borderRadius: 14,
		padding: 14,
		gap: 6,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "700",
	},
	headerBody: {
		fontSize: 13,
		lineHeight: 18,
	},
	headerMuted: {
		fontSize: 12,
		lineHeight: 17,
	},
	statusRow: {
		marginTop: 4,
		paddingTop: 10,
		borderTopWidth: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 8,
	},
	statusLabel: {
		fontSize: 12,
	},
	statusValue: {
		fontSize: 12,
		fontWeight: "700",
	},
	devWarningCard: {
		borderRadius: 14,
		padding: 12,
		gap: 4,
	},
	devWarningTitle: {
		fontSize: 13,
		fontWeight: "700",
	},
	devWarningBody: {
		fontSize: 12,
		lineHeight: 17,
	},
	fairRunCard: {
		borderRadius: 14,
		padding: 14,
		gap: 8,
	},
	fairRunTitle: {
		fontSize: 15,
		fontWeight: "700",
	},
	fairRunBody: {
		fontSize: 12,
		lineHeight: 17,
	},
	fairRunProgress: {
		fontSize: 12,
		lineHeight: 17,
	},
	fairRunButton: {
		borderRadius: 999,
		paddingVertical: 10,
		alignItems: "center",
	},
	fairRunButtonText: {
		fontSize: 13,
		fontWeight: "700",
	},
	fairRunCancelButton: {
		borderRadius: 999,
		paddingVertical: 9,
		alignItems: "center",
	},
	fairRunCancelText: {
		fontSize: 12,
		fontWeight: "600",
	},
	implCard: {
		borderRadius: 14,
		padding: 14,
		gap: 10,
	},
	implHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 8,
	},
	implTitle: {
		fontSize: 15,
		fontWeight: "700",
	},
	implRuns: {
		fontSize: 12,
	},
	runButton: {
		borderRadius: 999,
		paddingVertical: 10,
		alignItems: "center",
	},
	runButtonDisabled: {
		opacity: 0.45,
	},
	runButtonText: {
		fontSize: 13,
		fontWeight: "700",
	},
	implMetrics: {
		gap: 8,
	},
	metricLine: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 12,
	},
	metricLabel: {
		flex: 1,
		fontSize: 12,
	},
	metricValue: {
		fontSize: 12,
		fontFamily: "monospace",
		textAlign: "right",
	},
	emptyText: {
		fontSize: 12,
		lineHeight: 17,
	},
	summaryCard: {
		borderRadius: 14,
		padding: 14,
		gap: 8,
	},
	summaryTitle: {
		fontSize: 15,
		fontWeight: "700",
	},
	speedSummary: {
		fontSize: 12,
		fontWeight: "700",
	},
	summaryWinnerText: {
		fontSize: 17,
		fontWeight: "700",
	},
	summaryDelta: {
		fontSize: 12,
		lineHeight: 17,
	},
	summaryHint: {
		fontSize: 12,
		lineHeight: 17,
	},
	clearButton: {
		borderRadius: 999,
		paddingVertical: 10,
		alignItems: "center",
	},
	clearButtonText: {
		fontSize: 13,
		fontWeight: "600",
	},
});
