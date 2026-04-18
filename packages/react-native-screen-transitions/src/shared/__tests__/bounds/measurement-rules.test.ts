import { beforeEach, describe, expect, it } from "bun:test";
import type { MeasureIntent } from "../../components/create-boundary-component/types";
import {
	getMeasureIntentFlags,
	resolveMeasureWritePlan,
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
});
