import { beforeEach, describe, expect, it } from "bun:test";
import type { MeasureIntent } from "../../components/create-boundary-component/types";
import {
	canFlushGroupActiveMeasurement,
	getMeasureIntentFlags,
	resolveAutoSourceCaptureSignal,
	resolveGroupActiveMeasurementAction,
	resolveMeasureWritePlan,
	resolvePendingDestinationCaptureSignal,
	resolvePendingDestinationRetrySignal,
	PREPARE_DESTINATION_MEASUREMENT_INTENT,
	resolvePrepareSourceMeasurementIntent,
	shouldTriggerScrollSettledRefresh,
} from "../../components/create-boundary-component/hooks/helpers/measurement-rules";

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("bounds measurement rules", () => {
	it("derives explicit intent flags and write plans", () => {
		const intents = getMeasureIntentFlags([
			"complete-destination",
		] satisfies readonly MeasureIntent[]);

		expect(intents).toEqual({
			captureSource: false,
			completeDestination: true,
			refreshSource: false,
			refreshDestination: false,
		});

		const plan = resolveMeasureWritePlan({
			intents,
			hasPendingLink: true,
			hasSourceLink: false,
			hasDestinationLink: false,
			hasAttachableSourceLink: false,
		});

		expect(plan).toEqual({
			captureSource: false,
			completeDestination: true,
			refreshSource: false,
			refreshDestination: false,
			writesAny: true,
			wantsDestinationWrite: true,
		});
	});

	it("refresh-source only writes when a source link exists", () => {
		const intents = getMeasureIntentFlags("refresh-source");

		expect(intents).toEqual({
			captureSource: false,
			completeDestination: false,
			refreshSource: true,
			refreshDestination: false,
		});

		expect(
			resolveMeasureWritePlan({
				intents,
				hasPendingLink: false,
				hasSourceLink: false,
				hasDestinationLink: false,
				hasAttachableSourceLink: false,
			}),
		).toEqual({
			captureSource: false,
			completeDestination: false,
			refreshSource: false,
			refreshDestination: false,
			writesAny: false,
			wantsDestinationWrite: false,
		});

		const plan = resolveMeasureWritePlan({
			intents,
			hasPendingLink: false,
			hasSourceLink: true,
			hasDestinationLink: false,
			hasAttachableSourceLink: false,
		});

		expect(plan).toEqual({
			captureSource: false,
			completeDestination: false,
			refreshSource: true,
			refreshDestination: false,
			writesAny: true,
			wantsDestinationWrite: false,
		});
	});

	it("auto-captures source whenever the next screen exists", () => {
		expect(
			resolveAutoSourceCaptureSignal({
				enabled: true,
				nextScreenKey: "detail",
				tagPresence: undefined,
			}),
		).toBe("detail");

		expect(
			resolveAutoSourceCaptureSignal({
				enabled: true,
				nextScreenKey: "detail",
				tagPresence: {
					detail: { count: 1 },
					list: { count: 1 },
				},
			}),
		).toBe("detail");

		expect(
			resolveAutoSourceCaptureSignal({
				enabled: true,
				nextScreenKey: "detail",
				tagPresence: {
					nested: { count: 1, ancestorKeys: ["detail"] },
				},
			}),
		).toBe("detail");
	});

	it("only completes destination when an attachable source link exists", () => {
		expect(
			resolvePendingDestinationCaptureSignal({
				enabled: true,
				resolvedSourceKey: "list",
				hasAttachableSourceLink: false,
				hasDestinationLink: false,
			}),
		).toBe(0);

		expect(
			resolvePendingDestinationCaptureSignal({
				enabled: true,
				resolvedSourceKey: "list",
				hasAttachableSourceLink: true,
				hasDestinationLink: false,
			}),
		).toBe("list");

		expect(
			resolvePendingDestinationCaptureSignal({
				enabled: true,
				resolvedSourceKey: "list",
				hasAttachableSourceLink: true,
				hasDestinationLink: true,
			}),
		).toBe(0);
	});

	it("retries destination measurement only inside the valid retry window", () => {
		expect(
			resolvePendingDestinationRetrySignal({
				enabled: true,
				retryCount: 0,
				maxRetries: 4,
				isAnimating: true,
				hasDestinationLink: false,
				progress: 0.24,
				retryProgressMax: 1.05,
				retryProgressBuckets: 8,
				resolvedSourceKey: "list",
				hasAttachableSourceLink: true,
			}),
		).toBe(2);

		expect(
			resolvePendingDestinationRetrySignal({
				enabled: true,
				retryCount: 4,
				maxRetries: 4,
				isAnimating: true,
				hasDestinationLink: false,
				progress: 0.24,
				retryProgressMax: 1.05,
				retryProgressBuckets: 8,
				resolvedSourceKey: "list",
				hasAttachableSourceLink: true,
			}),
		).toBe(0);

		expect(
			resolvePendingDestinationRetrySignal({
				enabled: true,
				retryCount: 0,
				maxRetries: 4,
				isAnimating: true,
				hasDestinationLink: true,
				progress: 0.24,
				retryProgressMax: 1.05,
				retryProgressBuckets: 8,
				resolvedSourceKey: "list",
				hasAttachableSourceLink: true,
			}),
		).toBe(0);
	});

	it("maps prepare-transition source measurement by group refresh policy", () => {
		expect(
			resolvePrepareSourceMeasurementIntent({
				hasSourceLink: false,
				shouldRefreshExistingSource: false,
			}),
		).toBe("capture-source");
		expect(
			resolvePrepareSourceMeasurementIntent({
				hasSourceLink: true,
				shouldRefreshExistingSource: false,
			}),
		).toBe(null);
		expect(
			resolvePrepareSourceMeasurementIntent({
				hasSourceLink: true,
				shouldRefreshExistingSource: true,
			}),
		).toBe("refresh-source");
		expect(PREPARE_DESTINATION_MEASUREMENT_INTENT).toEqual([
			"complete-destination",
			"refresh-destination",
		]);
	});

	it("gates grouped refresh actions to the active member only", () => {
		expect(
			resolveGroupActiveMeasurementAction({
				enabled: true,
				isEligible: true,
				memberId: "2",
				activeId: "1",
				previousActiveId: "2",
			}),
		).toBe("clear-pending");

		expect(
			resolveGroupActiveMeasurementAction({
				enabled: true,
				isEligible: true,
				memberId: "2",
				activeId: "2",
				previousActiveId: "1",
			}),
		).toBe("queue-or-flush");

		expect(
			resolveGroupActiveMeasurementAction({
				enabled: true,
				isEligible: true,
				memberId: "2",
				activeId: "2",
				previousActiveId: "2",
			}),
		).toBe("noop");

		expect(
			canFlushGroupActiveMeasurement({
				enabled: true,
				isEligible: true,
				memberId: "2",
				activeId: "2",
			}),
		).toBe(true);

		expect(
			canFlushGroupActiveMeasurement({
				enabled: true,
				isEligible: true,
				memberId: "2",
				activeId: "1",
			}),
		).toBe(false);
	});

	it("only refreshes from scroll settle on grouped source boundaries", () => {
		expect(
			shouldTriggerScrollSettledRefresh({
				enabled: true,
				group: "photos",
				hasNextScreen: true,
				hasSettledSignal: true,
				signal: 2,
				previousSignal: 1,
			}),
		).toBe(true);

		expect(
			shouldTriggerScrollSettledRefresh({
				enabled: true,
				group: undefined,
				hasNextScreen: true,
				hasSettledSignal: true,
				signal: 2,
				previousSignal: 1,
			}),
		).toBe(false);

		expect(
			shouldTriggerScrollSettledRefresh({
				enabled: true,
				group: "photos",
				hasNextScreen: false,
				hasSettledSignal: true,
				signal: 2,
				previousSignal: 1,
			}),
		).toBe(false);
	});
});
