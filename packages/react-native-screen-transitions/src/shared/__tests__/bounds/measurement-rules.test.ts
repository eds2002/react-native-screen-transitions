import { beforeEach, describe, expect, it } from "bun:test";
import type { MeasureIntent } from "../../components/create-boundary-component/types";
import {
	getMeasureIntentFlags,
	buildMeasurementWritePlan,
	shouldBlockInitialDestinationMeasurement,
} from "../../components/create-boundary-component/hooks/helpers/measurement-rules";
import { createLinkContext } from "../../components/create-boundary-component/hooks/helpers/boundary-link-context";
import { BoundStore, type Snapshot } from "../../stores/bounds";

const createBounds = (): Snapshot["bounds"] => ({
	x: 0,
	y: 0,
	pageX: 0,
	pageY: 0,
	width: 100,
	height: 100,
});

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("bounds measurement rules", () => {
	it("blocks initial destination measurement only when a source can attach", () => {
		const firstSourceScreenContext = createLinkContext({
			sharedBoundTag: "card",
			currentScreenKey: "source",
			preferredSourceScreenKey: "index",
		});

		expect(
			shouldBlockInitialDestinationMeasurement({
				enabled: true,
				hasDestinationLink: firstSourceScreenContext.hasDestinationLink,
				hasAttachableSourceLink:
					firstSourceScreenContext.hasAttachableSourceLink,
			}),
		).toBe(false);

		BoundStore.link.setSource("capture", "card", "source", createBounds());

		const destinationContext = createLinkContext({
			sharedBoundTag: "card",
			currentScreenKey: "destination",
			preferredSourceScreenKey: "source",
		});

		expect(
			shouldBlockInitialDestinationMeasurement({
				enabled: true,
				hasDestinationLink: destinationContext.hasDestinationLink,
				hasAttachableSourceLink: destinationContext.hasAttachableSourceLink,
			}),
		).toBe(true);
	});

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

		const plan = buildMeasurementWritePlan({
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
			buildMeasurementWritePlan({
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

		const plan = buildMeasurementWritePlan({
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
