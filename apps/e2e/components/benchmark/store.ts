import { create } from "zustand";
import {
	BENCHMARK_CYCLES,
	BENCHMARK_MAX_HISTORY_PER_IMPL,
	BENCHMARK_TRANSITION_DURATION_MS,
} from "./constants";
import { computeFrameStats, computeMetricSummary } from "./stats";
import type {
	BenchmarkRunResult,
	BenchmarkScenario,
	BenchmarkStackImpl,
} from "./types";

interface CycleTimingRecord {
	pushDispatchAt?: number;
	pushMountedAt?: number;
	pushLatencyMs?: number;
	popDispatchAt?: number;
	popFocusedAt?: number;
	popLatencyMs?: number;
	cycleDurationMs?: number;
	navigateTargetMountedAt?: number;
}

export interface ActiveBenchmarkRun {
	id: string;
	impl: BenchmarkStackImpl;
	scenario: BenchmarkScenario;
	totalCycles: number;
	startedAt: number;
	currentCycle: number;
	completedCycles: number;
	pendingReturnCycle: number | null;
	cycleRecords: Record<number, CycleTimingRecord>;
	pushLatencies: number[];
	popLatencies: number[];
	cycleDurations: number[];
}

export interface FairRunStep {
	scenario: BenchmarkScenario;
	impl: BenchmarkStackImpl;
	stepIndex: number;
	totalSteps: number;
	runNumberForImplScenario: number;
}

export interface FairRunPlan {
	id: string;
	runsPerImpl: number;
	nextStepIndex: number;
	steps: FairRunStep[];
}

interface CycleCompletion {
	completedCycle: number | null;
	done: boolean;
}

type ScenarioResultsByImpl = Record<
	BenchmarkScenario,
	Partial<Record<BenchmarkStackImpl, BenchmarkRunResult>>
>;

type ScenarioHistoryByImpl = Record<
	BenchmarkScenario,
	Record<BenchmarkStackImpl, BenchmarkRunResult[]>
>;

interface BenchmarkStoreState {
	activeRun: ActiveBenchmarkRun | null;
	fairRunPlan: FairRunPlan | null;
	resultsByScenarioImpl: ScenarioResultsByImpl;
	historyByScenarioImpl: ScenarioHistoryByImpl;
	startFairRun: (runsPerImpl: number) => void;
	consumeNextFairRunStep: () => FairRunStep | null;
	cancelFairRun: () => void;
	beginRun: (impl: BenchmarkStackImpl, scenario: BenchmarkScenario) => string;
	recordPushDispatch: (runId: string, cycle: number, timestamp: number) => void;
	recordRunMounted: (runId: string, cycle: number, timestamp: number) => void;
	recordPopDispatch: (runId: string, cycle: number, timestamp: number) => void;
	recordNavigateTargetMounted: (
		runId: string,
		cycle: number,
		timestamp: number,
	) => void;
	completeCycleOnFocus: (runId: string, timestamp: number) => CycleCompletion;
	finishRun: (runId: string) => BenchmarkRunResult | null;
	abortRun: (runId?: string) => void;
	clearResults: () => void;
}

let frameRequestId: number | null = null;
let frameLastTimestamp: number | null = null;
let frameDeltasMs: number[] = [];

const createRunId = (impl: BenchmarkStackImpl): string =>
	`${impl}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createFairRunId = (): string =>
	`fair-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createResultsByScenarioImpl = (): ScenarioResultsByImpl => ({
	"push-pop-loop": {},
	"navigate-during-close": {},
});

const createHistoryByScenarioImpl = (): ScenarioHistoryByImpl => ({
	"push-pop-loop": {
		"blank-stack": [],
		"js-stack": [],
	},
	"navigate-during-close": {
		"blank-stack": [],
		"js-stack": [],
	},
});

const createFairRunSteps = (runsPerImpl: number): FairRunStep[] => {
	const scenarios: BenchmarkScenario[] = [
		"push-pop-loop",
		"navigate-during-close",
	];
	const implOrder: BenchmarkStackImpl[] = ["blank-stack", "js-stack"];
	const steps: FairRunStep[] = [];

	for (const scenario of scenarios) {
		for (let runNumber = 1; runNumber <= runsPerImpl; runNumber += 1) {
			const roundOrder =
				runNumber % 2 === 1 ? implOrder : [...implOrder].reverse();
			for (const impl of roundOrder) {
				steps.push({
					scenario,
					impl,
					stepIndex: steps.length + 1,
					totalSteps: scenarios.length * runsPerImpl * implOrder.length,
					runNumberForImplScenario: runNumber,
				});
			}
		}
	}

	return steps;
};

const stopFrameSampling = (): number[] => {
	if (frameRequestId !== null) {
		cancelAnimationFrame(frameRequestId);
		frameRequestId = null;
	}

	frameLastTimestamp = null;
	const captured = [...frameDeltasMs];
	frameDeltasMs = [];
	return captured;
};

const startFrameSampling = () => {
	stopFrameSampling();

	const onFrame = (timestamp: number) => {
		if (frameLastTimestamp !== null) {
			frameDeltasMs.push(timestamp - frameLastTimestamp);
		}
		frameLastTimestamp = timestamp;
		frameRequestId = requestAnimationFrame(onFrame);
	};

	frameRequestId = requestAnimationFrame(onFrame);
};

const nowMs = () => performance.now();

export const useBenchmarkStore = create<BenchmarkStoreState>((set, get) => ({
	activeRun: null,
	fairRunPlan: null,
	resultsByScenarioImpl: createResultsByScenarioImpl(),
	historyByScenarioImpl: createHistoryByScenarioImpl(),

	startFairRun: (runsPerImpl) => {
		const normalizedRuns = Math.max(1, Math.floor(runsPerImpl));
		set({
			fairRunPlan: {
				id: createFairRunId(),
				runsPerImpl: normalizedRuns,
				nextStepIndex: 0,
				steps: createFairRunSteps(normalizedRuns),
			},
		});
	},

	consumeNextFairRunStep: () => {
		const plan = get().fairRunPlan;
		if (!plan) return null;

		const nextStep = plan.steps[plan.nextStepIndex];
		if (!nextStep) {
			set({ fairRunPlan: null });
			return null;
		}

		const nextIndex = plan.nextStepIndex + 1;
		set({
			fairRunPlan:
				nextIndex >= plan.steps.length
					? null
					: {
							...plan,
							nextStepIndex: nextIndex,
						},
		});

		return nextStep;
	},

	cancelFairRun: () => {
		set({ fairRunPlan: null });
	},

	beginRun: (impl, scenario) => {
		startFrameSampling();
		const id = createRunId(impl);

		set({
			activeRun: {
				id,
				impl,
				scenario,
				totalCycles: BENCHMARK_CYCLES,
				startedAt: nowMs(),
				currentCycle: 0,
				completedCycles: 0,
				pendingReturnCycle: null,
				cycleRecords: {},
				pushLatencies: [],
				popLatencies: [],
				cycleDurations: [],
			},
		});

		return id;
	},

	recordPushDispatch: (runId, cycle, timestamp) => {
		set((state) => {
			const run = state.activeRun;
			if (!run || run.id !== runId) return state;

			const record = run.cycleRecords[cycle] ?? {};

			return {
				activeRun: {
					...run,
					currentCycle: cycle,
					cycleRecords: {
						...run.cycleRecords,
						[cycle]: {
							...record,
							pushDispatchAt: timestamp,
						},
					},
				},
			};
		});
	},

	recordRunMounted: (runId, cycle, timestamp) => {
		set((state) => {
			const run = state.activeRun;
			if (!run || run.id !== runId) return state;

			const record = run.cycleRecords[cycle] ?? {};
			const nextRecord: CycleTimingRecord = {
				...record,
				pushMountedAt: timestamp,
			};

			let pushLatencies = run.pushLatencies;
			if (
				nextRecord.pushDispatchAt !== undefined &&
				nextRecord.pushLatencyMs === undefined
			) {
				nextRecord.pushLatencyMs = timestamp - nextRecord.pushDispatchAt;
				pushLatencies = [...pushLatencies, nextRecord.pushLatencyMs];
			}

			return {
				activeRun: {
					...run,
					pushLatencies,
					cycleRecords: {
						...run.cycleRecords,
						[cycle]: nextRecord,
					},
				},
			};
		});
	},

	recordPopDispatch: (runId, cycle, timestamp) => {
		set((state) => {
			const run = state.activeRun;
			if (!run || run.id !== runId) return state;

			const record = run.cycleRecords[cycle] ?? {};
			return {
				activeRun: {
					...run,
					pendingReturnCycle: cycle,
					cycleRecords: {
						...run.cycleRecords,
						[cycle]: {
							...record,
							popDispatchAt: timestamp,
						},
					},
				},
			};
		});
	},

	recordNavigateTargetMounted: (runId, cycle, timestamp) => {
		set((state) => {
			const run = state.activeRun;
			if (!run || run.id !== runId) return state;

			const record = run.cycleRecords[cycle] ?? {};
			return {
				activeRun: {
					...run,
					cycleRecords: {
						...run.cycleRecords,
						[cycle]: {
							...record,
							navigateTargetMountedAt: timestamp,
						},
					},
				},
			};
		});
	},

	completeCycleOnFocus: (runId, timestamp) => {
		let completion: CycleCompletion = {
			completedCycle: null,
			done: false,
		};

		set((state) => {
			const run = state.activeRun;
			if (!run || run.id !== runId) return state;
			if (run.pendingReturnCycle === null) return state;

			const cycle = run.pendingReturnCycle;
			const record = run.cycleRecords[cycle] ?? {};
			if (
				run.scenario === "navigate-during-close" &&
				record.navigateTargetMountedAt === undefined
			) {
				const timedOutWaitingForNavigateTarget =
					record.popDispatchAt !== undefined &&
					timestamp - record.popDispatchAt >=
						BENCHMARK_TRANSITION_DURATION_MS + 180;
				if (!timedOutWaitingForNavigateTarget) {
					return state;
				}
			}

			const nextRecord: CycleTimingRecord = {
				...record,
				popFocusedAt: timestamp,
			};
			if (
				run.scenario === "navigate-during-close" &&
				nextRecord.navigateTargetMountedAt === undefined
			) {
				nextRecord.navigateTargetMountedAt = timestamp;
			}

			let pushLatencies = run.pushLatencies;
			if (
				nextRecord.pushLatencyMs === undefined &&
				nextRecord.pushDispatchAt !== undefined &&
				nextRecord.pushMountedAt !== undefined
			) {
				nextRecord.pushLatencyMs =
					nextRecord.pushMountedAt - nextRecord.pushDispatchAt;
				pushLatencies = [...pushLatencies, nextRecord.pushLatencyMs];
			}

			let popLatencies = run.popLatencies;
			if (
				nextRecord.popLatencyMs === undefined &&
				nextRecord.popDispatchAt !== undefined
			) {
				nextRecord.popLatencyMs = timestamp - nextRecord.popDispatchAt;
				popLatencies = [...popLatencies, nextRecord.popLatencyMs];
			}

			let cycleDurations = run.cycleDurations;
			if (
				nextRecord.cycleDurationMs === undefined &&
				nextRecord.pushDispatchAt !== undefined
			) {
				nextRecord.cycleDurationMs = timestamp - nextRecord.pushDispatchAt;
				cycleDurations = [...cycleDurations, nextRecord.cycleDurationMs];
			}

			const completedCycles = Math.max(run.completedCycles, cycle);
			const done = completedCycles >= run.totalCycles;
			completion = {
				completedCycle: cycle,
				done,
			};

			return {
				activeRun: {
					...run,
					completedCycles,
					pendingReturnCycle: null,
					pushLatencies,
					popLatencies,
					cycleDurations,
					cycleRecords: {
						...run.cycleRecords,
						[cycle]: nextRecord,
					},
				},
			};
		});

		return completion;
	},

	finishRun: (runId) => {
		const run = get().activeRun;
		if (!run || run.id !== runId) return null;

		const frameDeltas = stopFrameSampling();
		const frameStats = computeFrameStats(frameDeltas);
		const history =
			get().historyByScenarioImpl[run.scenario][run.impl];
		const runIndex = history.length + 1;

		const result: BenchmarkRunResult = {
			pushLatencyMs: computeMetricSummary(run.pushLatencies),
			popLatencyMs: computeMetricSummary(run.popLatencies),
			cycleDurationMs: computeMetricSummary(run.cycleDurations),
			avgFrameMs: frameStats.avgFrameMs,
			p95FrameMs: frameStats.p95FrameMs,
			effectiveFps: frameStats.effectiveFps,
			jankPct: frameStats.jankPct,
			cycles: run.totalCycles,
			timestamp: Date.now(),
			scenario: run.scenario,
			buildMode: __DEV__ ? "dev" : "release",
			runId: run.id,
			runIndex,
		};

		set((state) => ({
			activeRun: null,
			resultsByScenarioImpl: {
				...state.resultsByScenarioImpl,
				[run.scenario]: {
					...state.resultsByScenarioImpl[run.scenario],
					[run.impl]: result,
				},
			},
			historyByScenarioImpl: {
				...state.historyByScenarioImpl,
				[run.scenario]: {
					...state.historyByScenarioImpl[run.scenario],
					[run.impl]: [
						...state.historyByScenarioImpl[run.scenario][run.impl],
						result,
					].slice(-BENCHMARK_MAX_HISTORY_PER_IMPL),
				},
			},
		}));

		return result;
	},

	abortRun: (runId) => {
		const run = get().activeRun;
		if (!run) return;
		if (runId && run.id !== runId) return;

		stopFrameSampling();
		set({ activeRun: null });
	},

	clearResults: () => {
		stopFrameSampling();
		set({
			activeRun: null,
			fairRunPlan: null,
			resultsByScenarioImpl: createResultsByScenarioImpl(),
			historyByScenarioImpl: createHistoryByScenarioImpl(),
		});
	},
}));
