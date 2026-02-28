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
	BENCHMARK_RECOMMENDED_RUNS_PER_IMPL,
	BENCHMARK_TRANSPARENCY_NOTE,
} from "@/components/benchmark/constants";
import {
	buildBenchmarkPath,
} from "@/components/benchmark/impl-routing";
import { useBenchmarkStore } from "@/components/benchmark/store";
import type { FairRunStep } from "@/components/benchmark/store";
import type {
	BenchmarkRunResult,
	BenchmarkScenario,
	BenchmarkStackImpl,
} from "@/components/benchmark/types";

type Confidence = "Low" | "Medium" | "High";

const SCENARIOS: Array<{
	id: BenchmarkScenario;
	title: string;
	description: string;
}> = [
	{
		id: "push-pop-loop",
		title: "Scenario A: Push/Pop Loop",
		description:
			"Automated push->worker->pop cycle timing benchmark (20 cycles per run).",
	},
	{
		id: "navigate-during-close",
		title: "Scenario B: Navigate During Close",
		description:
			"Automated timing benchmark where router.navigate(...) is fired during close transition.",
	},
];

const formatMs = (value: number) => `${value.toFixed(2)}ms`;
const formatDeltaPct = (value: number) =>
	`${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

const getImplLabel = (impl: BenchmarkStackImpl) =>
	impl === "blank-stack" ? "Blank Stack" : "JS Stack";

const getScenarioLabel = (scenario: BenchmarkScenario) =>
	scenario === "navigate-during-close"
		? "Navigate During Close"
		: "Push/Pop Loop";

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

function MetricLine({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.metricLine}>
			<Text style={styles.metricLabel}>{label}</Text>
			<Text style={styles.metricValue}>{value}</Text>
		</View>
	);
}

function LatestResultCard({
	scenario,
	impl,
	result,
	runCount,
	disabled,
	isRunning,
	onRun,
}: {
	scenario: BenchmarkScenario;
	impl: BenchmarkStackImpl;
	result: BenchmarkRunResult | undefined;
	runCount: number;
	disabled: boolean;
	isRunning: boolean;
	onRun: (scenario: BenchmarkScenario, impl: BenchmarkStackImpl) => void;
}) {
	return (
		<View style={styles.implCard}>
			<View style={styles.implHeader}>
				<Text style={styles.implTitle}>{getImplLabel(impl)}</Text>
				<Text style={styles.implRuns}>Runs: {runCount}</Text>
			</View>

			<Pressable
				testID={`benchmark-run-${scenario}-${impl}`}
				style={[styles.runButton, disabled && styles.runButtonDisabled]}
				disabled={disabled}
				onPress={() => onRun(scenario, impl)}
			>
				<Text style={styles.runButtonText}>
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
				<Text style={styles.emptyText}>No result captured for this stack yet.</Text>
			)}
		</View>
	);
}

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
	const slowerImpl: BenchmarkStackImpl | null = isTie
		? null
		: fasterImpl === "blank-stack"
			? "js-stack"
			: "blank-stack";
	const fasterValue =
		fasterImpl === "blank-stack" ? cycleMedianBlank : cycleMedianJs;
	const slowerValue =
		fasterImpl === "blank-stack" ? cycleMedianJs : cycleMedianBlank;
	const speedPct =
		isTie || slowerValue <= 0 ? 0 : ((slowerValue - fasterValue) / slowerValue) * 100;

	let confidence: Confidence = "Low";
	let confidenceReason = "Need more runs on both stacks.";
	if (__DEV__) {
		confidence = "Low";
		confidenceReason =
			"Dev mode timings are noisy; confidence is capped at Low.";
	} else if (runsPerImpl < BENCHMARK_MIN_RUNS_FOR_PRELIMINARY) {
		confidence = "Low";
		confidenceReason = `Need at least ${BENCHMARK_MIN_RUNS_FOR_PRELIMINARY} runs per stack.`;
	} else if (speedPct < BENCHMARK_EFFECT_SIZE_MIN_PCT) {
		confidence = "Low";
		confidenceReason = `Effect size is below ${BENCHMARK_EFFECT_SIZE_MIN_PCT}% for this scenario.`;
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

function QuickAnswerCard({
	summaries,
}: {
	summaries: Partial<Record<BenchmarkScenario, ScenarioSummary | null>>;
}) {
	const pushPop = summaries["push-pop-loop"];
	const navigateClose = summaries["navigate-during-close"];

	const isReliableScenario = (summary: ScenarioSummary | null | undefined) =>
		summary && summary.confidence !== "Low" && !!summary.fasterImpl;
	const hasBothReliableScenarios =
		isReliableScenario(pushPop) && isReliableScenario(navigateClose);

	let overallVerdict = "No reliable overall winner yet.";
	let overallHint = "Need Medium/High confidence in both scenarios first.";
	if (hasBothReliableScenarios && pushPop && navigateClose) {
		if (pushPop.fasterImpl === navigateClose.fasterImpl) {
			overallVerdict = `Overall winner: ${getImplLabel(pushPop.fasterImpl as BenchmarkStackImpl)}`;
			overallHint = "Both scenarios agree with Medium/High confidence.";
		} else {
			overallVerdict = "No single winner: scenarios disagree.";
			overallHint =
				"Each scenario measures different behavior. Treat as split result.";
		}
	}

	const renderScenarioVerdict = (
		label: string,
		summary: ScenarioSummary | null | undefined,
	) => {
		if (!summary) {
			return (
				<Text style={styles.quickScenarioText}>
					{label}: Need at least 1 run for both stacks.
				</Text>
			);
		}

		if (!summary.fasterImpl || summary.speedPct <= 0) {
			return (
				<Text style={styles.quickScenarioText}>
					{label}: Tie in this session.
				</Text>
			);
		}

		const winner = getImplLabel(summary.fasterImpl);
		if (summary.confidence === "Low") {
			return (
				<Text style={styles.quickScenarioText}>
					{label}: {winner} is currently ahead by {summary.speedPct.toFixed(2)}%
					(LOW confidence).
				</Text>
			);
		}

		return (
			<Text style={styles.quickScenarioText}>
				{label}: {winner} is faster by {summary.speedPct.toFixed(2)}% (
				{summary.confidence} confidence).
			</Text>
		);
	};

	return (
		<View style={styles.quickAnswerCard}>
			<Text style={styles.quickAnswerTitle}>Quick Answer</Text>
			<Text style={styles.quickAnswerVerdict}>{overallVerdict}</Text>
			{renderScenarioVerdict("Push/Pop Loop", pushPop)}
			{renderScenarioVerdict("Navigate During Close", navigateClose)}
			<Text style={styles.quickAnswerHint}>{overallHint}</Text>
		</View>
	);
}

function ScenarioSection({
	scenario,
	title,
	description,
	activeRun,
	controlsDisabled,
	blankResult,
	jsResult,
	blankHistory,
	jsHistory,
	onRun,
}: {
	scenario: BenchmarkScenario;
	title: string;
	description: string;
	activeRun: ReturnType<typeof useBenchmarkStore.getState>["activeRun"];
	controlsDisabled: boolean;
	blankResult: BenchmarkRunResult | undefined;
	jsResult: BenchmarkRunResult | undefined;
	blankHistory: BenchmarkRunResult[];
	jsHistory: BenchmarkRunResult[];
	onRun: (scenario: BenchmarkScenario, impl: BenchmarkStackImpl) => void;
}) {
	const summary = useMemo(
		() => buildScenarioSummary(blankHistory, jsHistory),
		[blankHistory, jsHistory],
	);

	return (
		<View style={styles.sectionCard}>
			<Text style={styles.sectionTitle}>{title}</Text>
			<Text style={styles.sectionDescription}>{description}</Text>

			<LatestResultCard
				scenario={scenario}
				impl="blank-stack"
				result={blankResult}
				runCount={blankHistory.length}
				disabled={controlsDisabled}
				isRunning={
					activeRun?.scenario === scenario && activeRun?.impl === "blank-stack"
				}
				onRun={onRun}
			/>

			<LatestResultCard
				scenario={scenario}
				impl="js-stack"
				result={jsResult}
				runCount={jsHistory.length}
				disabled={controlsDisabled}
				isRunning={activeRun?.scenario === scenario && activeRun?.impl === "js-stack"}
				onRun={onRun}
			/>

			<View style={styles.summaryCard}>
				<Text style={styles.summaryTitle}>Scenario Summary</Text>
				{summary ? (
					<>
						<Text style={styles.speedSummary}>
							{summary.confidence === "Low"
								? "Current leader only (not reliable yet)"
								: "Winner for this scenario"}
						</Text>
						<Text style={styles.summaryWinnerText}>
							{summary.fasterImpl
								? `${getImplLabel(summary.fasterImpl)} (${summary.speedPct.toFixed(2)}% faster)`
								: "Tie"}
						</Text>
						<MetricLine
							label="Median cycle time"
							value={`${formatMs(summary.cycleMedianBlank)} vs ${formatMs(summary.cycleMedianJs)} · Δ ${formatDeltaPct(summary.cycleDeltaPct)}`}
						/>
						<MetricLine
							label="Runs (blank / js)"
							value={`${summary.blankRuns} / ${summary.jsRuns}`}
						/>
						<MetricLine
							label="Confidence"
							value={summary.confidence}
						/>
						<Text style={styles.summaryHint}>{summary.confidenceReason}</Text>
					</>
				) : (
					<Text style={styles.summaryHint}>
						Run both stacks in this scenario to get a winner.
					</Text>
				)}
			</View>
		</View>
	);
}

export default function StackBenchmarkDashboardScreen() {
	const isFocused = useIsFocused();
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
	const clearResults = useBenchmarkStore((state) => state.clearResults);
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
		(scenario: BenchmarkScenario, impl: BenchmarkStackImpl) => {
			if (activeRun || fairRunPlan) return;
			const basePath = buildBenchmarkPath(impl);
			const path = `${basePath}?scenario=${scenario}&autorun=1&returnTo=${encodeURIComponent("/stack-benchmark")}`;
			router.push(path as never);
		},
		[activeRun, fairRunPlan],
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
			const path = `${basePath}?scenario=${step.scenario}&autorun=1&returnTo=${encodeURIComponent("/stack-benchmark")}&fairStep=${step.stepIndex}&fairTry=${attempt}`;
			router.push(path as never);

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
		[cancelFairRun, clearFairRunRetryTimeout],
	);

	const handleStartFairRun = useCallback(() => {
		if (activeRun || fairRunPlan) return;
		startFairRun(BENCHMARK_FAIR_RUNS_PER_IMPL);
	}, [activeRun, fairRunPlan, startFairRun]);

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
			return `Fair run queue ready • step ${Math.min(
				fairRunPlan.nextStepIndex + 1,
				fairRunPlan.steps.length,
			)}/${fairRunPlan.steps.length}`;
		}
		if (!activeRun) return "Idle";
		return `Running ${activeRun.scenario} on ${getImplLabel(activeRun.impl)} • cycle ${Math.max(
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
		return `Auto alternating in progress • ${launchedSteps}/${totalSteps} launched • next ${getScenarioLabel(nextStep.scenario)} (${getImplLabel(nextStep.impl)})`;
	}, [fairRunPlan]);

	const scenarioSummaries = useMemo(
		() => ({
			"push-pop-loop": buildScenarioSummary(
				historyByScenarioImpl["push-pop-loop"]["blank-stack"],
				historyByScenarioImpl["push-pop-loop"]["js-stack"],
			),
			"navigate-during-close": buildScenarioSummary(
				historyByScenarioImpl["navigate-during-close"]["blank-stack"],
				historyByScenarioImpl["navigate-during-close"]["js-stack"],
			),
		}),
		[historyByScenarioImpl],
	);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.headerCard}>
					<Text style={styles.headerTitle}>Transparent Stack Benchmark</Text>
					<Text style={styles.headerBody}>{BENCHMARK_TRANSPARENCY_NOTE}</Text>
					<Text style={styles.headerMuted}>{BENCHMARK_CAVEAT_NOTE}</Text>
					<View style={styles.statusRow}>
						<Text style={styles.statusLabel}>Status</Text>
						<Text style={styles.statusValue}>{statusText}</Text>
					</View>
				</View>

				<View style={styles.fairRunCard}>
					<Text style={styles.fairRunTitle}>Fair Run (Auto Alternating)</Text>
					<Text style={styles.fairRunBody}>
						One tap runs both scenarios with alternating order to reduce warmup/order
						bias ({BENCHMARK_FAIR_RUNS_PER_IMPL} runs per stack per scenario).
					</Text>
					{fairRunProgressText ? (
						<Text style={styles.fairRunProgress}>{fairRunProgressText}</Text>
					) : null}
					<Pressable
						testID="benchmark-fair-run-start"
						style={[
							styles.fairRunButton,
							(activeRun !== null || fairRunPlan !== null) &&
								styles.runButtonDisabled,
						]}
						disabled={activeRun !== null || fairRunPlan !== null}
						onPress={handleStartFairRun}
					>
						<Text style={styles.fairRunButtonText}>
							Start Fair Run ({BENCHMARK_FAIR_RUNS_PER_IMPL} each)
						</Text>
					</Pressable>
					{fairRunPlan ? (
						<Pressable
							testID="benchmark-fair-run-stop"
							style={styles.fairRunCancelButton}
							onPress={handleCancelFairRun}
						>
							<Text style={styles.fairRunCancelText}>Stop Fair Run Queue</Text>
						</Pressable>
					) : null}
				</View>

				<QuickAnswerCard summaries={scenarioSummaries} />

				{__DEV__ ? (
					<View style={styles.devWarningCard}>
						<Text style={styles.devWarningTitle}>Dev Build Warning</Text>
						<Text style={styles.devWarningBody}>
							Dev mode timings are noisy; confidence is capped at Low.
						</Text>
					</View>
				) : null}

				{SCENARIOS.map((item) => (
					<ScenarioSection
						key={item.id}
						scenario={item.id}
						title={item.title}
						description={item.description}
						activeRun={activeRun}
						controlsDisabled={activeRun !== null || fairRunPlan !== null}
						blankResult={resultsByScenarioImpl[item.id]["blank-stack"]}
						jsResult={resultsByScenarioImpl[item.id]["js-stack"]}
						blankHistory={historyByScenarioImpl[item.id]["blank-stack"]}
						jsHistory={historyByScenarioImpl[item.id]["js-stack"]}
						onRun={runBenchmark}
					/>
				))}

				<Pressable style={styles.clearButton} onPress={clearResults}>
					<Text style={styles.clearButtonText}>Clear Session Results</Text>
				</Pressable>
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
		paddingBottom: 36,
		gap: 12,
	},
	headerCard: {
		backgroundColor: "#101b2e",
		borderWidth: 1,
		borderColor: "#22344d",
		borderRadius: 12,
		padding: 14,
		gap: 6,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#f1f5f9",
	},
	headerBody: {
		fontSize: 13,
		lineHeight: 18,
		color: "#d1d9e7",
	},
	headerMuted: {
		fontSize: 12,
		lineHeight: 17,
		color: "#9aaac4",
	},
	statusRow: {
		marginTop: 4,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: "#22344d",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 8,
	},
	statusLabel: {
		fontSize: 12,
		color: "#9aaac4",
	},
	statusValue: {
		fontSize: 12,
		fontWeight: "700",
		color: "#e2e8f0",
	},
	devWarningCard: {
		backgroundColor: "#2b1c16",
		borderWidth: 1,
		borderColor: "#854d0e",
		borderRadius: 12,
		padding: 12,
		gap: 4,
	},
	devWarningTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: "#fdba74",
	},
	devWarningBody: {
		fontSize: 12,
		lineHeight: 17,
		color: "#fed7aa",
	},
	fairRunCard: {
		backgroundColor: "#101b2e",
		borderWidth: 1,
		borderColor: "#22344d",
		borderRadius: 12,
		padding: 14,
		gap: 8,
	},
	fairRunTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: "#f1f5f9",
	},
	fairRunBody: {
		fontSize: 12,
		lineHeight: 17,
		color: "#9aaac4",
	},
	fairRunProgress: {
		fontSize: 12,
		lineHeight: 17,
		color: "#bae6fd",
	},
	fairRunButton: {
		backgroundColor: "#0ea5e9",
		borderRadius: 10,
		paddingVertical: 10,
		alignItems: "center",
	},
	fairRunButtonText: {
		fontSize: 13,
		fontWeight: "700",
		color: "#fff",
	},
	fairRunCancelButton: {
		backgroundColor: "rgba(255,255,255,0.08)",
		borderRadius: 10,
		paddingVertical: 9,
		alignItems: "center",
	},
	fairRunCancelText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#e2e8f0",
	},
	quickAnswerCard: {
		backgroundColor: "#0f233e",
		borderWidth: 1,
		borderColor: "#1d4ed8",
		borderRadius: 12,
		padding: 14,
		gap: 8,
	},
	quickAnswerTitle: {
		fontSize: 17,
		fontWeight: "700",
		color: "#dbeafe",
	},
	quickAnswerVerdict: {
		fontSize: 15,
		fontWeight: "700",
		color: "#ffffff",
	},
	quickScenarioText: {
		fontSize: 13,
		lineHeight: 19,
		color: "#cbd5e1",
	},
	quickAnswerHint: {
		fontSize: 12,
		lineHeight: 17,
		color: "#93c5fd",
	},
	sectionCard: {
		backgroundColor: "#101b2e",
		borderWidth: 1,
		borderColor: "#22344d",
		borderRadius: 12,
		padding: 14,
		gap: 10,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#e2e8f0",
	},
	sectionDescription: {
		fontSize: 12,
		lineHeight: 17,
		color: "#9aaac4",
	},
	implCard: {
		backgroundColor: "#132139",
		borderWidth: 1,
		borderColor: "#2a3f5f",
		borderRadius: 10,
		padding: 12,
		gap: 8,
	},
	implHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	implTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#e2e8f0",
	},
	implRuns: {
		fontSize: 11,
		color: "#9aaac4",
	},
	runButton: {
		backgroundColor: "#0ea5e9",
		borderRadius: 9,
		paddingVertical: 10,
		alignItems: "center",
	},
	runButtonDisabled: {
		opacity: 0.5,
	},
	runButtonText: {
		fontSize: 13,
		fontWeight: "700",
		color: "#fff",
	},
	implMetrics: {
		gap: 5,
	},
	emptyText: {
		fontSize: 12,
		color: "#9aaac4",
	},
	summaryCard: {
		backgroundColor: "#132139",
		borderWidth: 1,
		borderColor: "#2a3f5f",
		borderRadius: 10,
		padding: 12,
		gap: 6,
	},
	summaryTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#e2e8f0",
	},
	speedSummary: {
		fontSize: 12,
		lineHeight: 17,
		fontWeight: "700",
		color: "#bae6fd",
	},
	summaryWinnerText: {
		fontSize: 18,
		fontWeight: "800",
		color: "#f8fafc",
	},
	summaryHint: {
		fontSize: 12,
		lineHeight: 17,
		color: "#9aaac4",
	},
	metricLine: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 8,
	},
	metricLabel: {
		fontSize: 12,
		color: "#9aaac4",
		flex: 1,
	},
	metricValue: {
		fontSize: 12,
		color: "#e2e8f0",
		fontFamily: "monospace",
	},
	clearButton: {
		backgroundColor: "#1b273a",
		borderWidth: 1,
		borderColor: "#2a3f5f",
		borderRadius: 10,
		paddingVertical: 11,
		alignItems: "center",
	},
	clearButtonText: {
		fontSize: 13,
		fontWeight: "700",
		color: "#dce5f4",
	},
});
