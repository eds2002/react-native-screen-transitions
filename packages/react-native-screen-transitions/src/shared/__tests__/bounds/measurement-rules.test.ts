import { beforeEach, describe, expect, it } from "bun:test";
import type { MeasurementIntent } from "../../components/create-boundary-component/types";
import {
	canFlushGroupActiveMeasurement,
	getMeasurementIntentFlags,
	resolveAutoSourceCaptureSignal,
	resolveGroupActiveMeasurementAction,
	resolveInitialLayoutMeasurementIntent,
	resolveMeasurementWritePlan,
	resolvePendingDestinationCaptureSignal,
	resolvePendingDestinationRetrySignal,
	shouldTriggerScrollSettledRefresh,
} from "../../components/create-boundary-component/hooks/helpers/measurement-rules";

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("bounds measurement rules", () => {
	it("derives explicit intent flags and write plans", () => {
		const intents = getMeasurementIntentFlags([
			"snapshot-only",
			"complete-destination",
		] satisfies readonly MeasurementIntent[]);

		expect(intents).toEqual({
			captureSource: false,
			completeDestination: true,
			refreshSource: false,
			refreshDestination: false,
			snapshotOnly: true,
		});

		const plan = resolveMeasurementWritePlan({
			intents,
			hasPendingLink: true,
			hasSourceLink: false,
			hasDestinationLink: false,
		});

		expect(plan).toEqual({
			captureSource: false,
			completeDestination: true,
			refreshSource: false,
			refreshDestination: false,
			registerSnapshot: true,
			writesAny: true,
			wantsDestinationWrite: true,
		});
	});

	it("refresh-source still snapshots untapped group members", () => {
		const intents = getMeasurementIntentFlags("refresh-source");

		expect(intents).toEqual({
			captureSource: false,
			completeDestination: false,
			refreshSource: true,
			refreshDestination: false,
			snapshotOnly: false,
		});

		const plan = resolveMeasurementWritePlan({
			intents,
			hasPendingLink: false,
			hasSourceLink: false,
			hasDestinationLink: false,
		});

		expect(plan).toEqual({
			captureSource: false,
			completeDestination: false,
			refreshSource: false,
			refreshDestination: false,
			registerSnapshot: true,
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

	it("only completes destination when a pending source link exists", () => {
		expect(
			resolvePendingDestinationCaptureSignal({
				enabled: true,
				resolvedSourceKey: "list",
				hasPendingLinkFromSource: false,
			}),
		).toBe(0);

		expect(
			resolvePendingDestinationCaptureSignal({
				enabled: true,
				resolvedSourceKey: "list",
				hasPendingLinkFromSource: true,
			}),
		).toBe("list");
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
				hasPendingLinkFromSource: true,
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
				hasPendingLinkFromSource: true,
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
				hasPendingLinkFromSource: true,
			}),
		).toBe(0);
	});

	it("chooses initial layout intent without over-measuring", () => {
		expect(
			resolveInitialLayoutMeasurementIntent({
				enabled: true,
				hasSharedBoundTag: true,
				hasMeasuredOnLayout: false,
				isAnyAnimating: false,
				hasPendingLinkFromSource: false,
			}),
		).toBeNull();

		expect(
			resolveInitialLayoutMeasurementIntent({
				enabled: true,
				hasSharedBoundTag: true,
				hasMeasuredOnLayout: false,
				isAnyAnimating: true,
				hasPendingLinkFromSource: true,
			}),
		).toBe("complete-destination");

		expect(
			resolveInitialLayoutMeasurementIntent({
				enabled: true,
				hasSharedBoundTag: true,
				hasMeasuredOnLayout: false,
				isAnyAnimating: true,
				hasPendingLinkFromSource: false,
			}),
		).toBeNull();

		expect(
			resolveInitialLayoutMeasurementIntent({
				enabled: true,
				hasSharedBoundTag: false,
				hasMeasuredOnLayout: false,
				isAnyAnimating: true,
				hasPendingLinkFromSource: true,
			}),
		).toBeNull();
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
