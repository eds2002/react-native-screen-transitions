import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { BoundTag } from "../../stores/bounds/types";
import { BoundStore } from "../../stores/bounds";
import { createScreenPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";
import { SystemStore } from "../../stores/system.store";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
	true;

const descriptorState = {
	derivations: {
		currentScreenKey: "screen-b",
		nextScreenKey: undefined as string | undefined,
		destinationPairKey: createScreenPairKey("screen-a", "screen-b"),
	},
};

let stackState = {
	scenes: [] as Array<{ activity: string; route: { key: string } }>,
};

mock.module("../../providers/screen/descriptors", () => ({
	useDescriptorsStore: <T,>(selector: (state: typeof descriptorState) => T) =>
		selector(descriptorState),
}));

mock.module("../../hooks/navigation/use-stack", () => ({
	useStack: <T,>(selector: (state: typeof stackState) => T) =>
		selector(stackState),
}));

let useInitialDestinationMeasurement: typeof import("../../components/boundary/hooks/lifecycles/use-initial-destination-measurement").useInitialDestinationMeasurement;

beforeAll(async () => {
	({ useInitialDestinationMeasurement } = await import(
		"../../components/boundary/hooks/lifecycles/use-initial-destination-measurement"
	));
});

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
	stackState = { scenes: [] };
	BoundStore.entry.set("card", "screen-a", {});
	BoundStore.entry.set("card", "screen-b", {});
	BoundStore.link.setSource(
		createScreenPairKey("screen-a", "screen-b"),
		"card",
		"screen-a",
		{
			x: 10,
			y: 20,
			pageX: 10,
			pageY: 20,
			width: 100,
			height: 100,
		},
	);
});

describe("initial destination measurement lifecycle", () => {
	it("does not restart a completed initial measurement after dependency changes", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const measurements: string[] = [];

		function Fixture({
			boundTag,
			revision,
		}: {
			boundTag: BoundTag;
			revision: number;
		}) {
			useInitialDestinationMeasurement({
				boundTag,
				enabled: true,
				measureBoundary: ({ pairKey: measuredPairKey }) => {
					measurements.push(`${revision}:${measuredPairKey}`);
					BoundStore.link.setDestination(
						measuredPairKey,
						"card",
						"screen-b",
						{
							x: 30,
							y: 40,
							pageX: 30,
							pageY: 40,
							width: 200,
							height: 200,
						},
					);
				},
			});
			return null;
		}

		let renderer: ReactTestRenderer;
		act(() => {
			renderer = create(
				<Fixture
					boundTag={{ tag: "card", linkKey: "card" }}
					revision={1}
				/>,
			);
		});

		stackState = {
			scenes: [{ activity: "active", route: { key: "screen-b" } }],
		};
		act(() => {
			renderer!.update(
				<Fixture
					boundTag={{ tag: "card", linkKey: "card" }}
					revision={2}
				/>,
			);
		});

		expect(measurements).toEqual([`1:${pairKey}`]);
		expect(
			SystemStore.getValue("screen-b", "pendingLifecycleStartBlockCount").get(),
		).toBe(0);
	});
});
