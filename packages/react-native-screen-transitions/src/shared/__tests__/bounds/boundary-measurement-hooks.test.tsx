import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useCaptureDestinationBoundary } from "../../components/create-boundary-component/hooks/use-capture-destination-boundary";
import { useCaptureSourceBoundary } from "../../components/create-boundary-component/hooks/use-capture-source-boundary";
import { useRefreshBoundary } from "../../components/create-boundary-component/hooks/use-refresh-boundary";
import type { MeasureParams } from "../../components/create-boundary-component/types";
import { AnimationStore } from "../../stores/animation.store";
import { BoundStore } from "../../stores/bounds";
import { GestureStore } from "../../stores/gesture.store";
import { SystemStore } from "../../stores/system.store";

const MEASURED_BOUNDS = {
	x: 0,
	y: 0,
	pageX: 0,
	pageY: 0,
	width: 120,
	height: 80,
};

const SOURCE_KEY = "source-screen";
const DESTINATION_KEY = "destination-screen";

const captureSource = (tag: string, screenKey = SOURCE_KEY) => {
	BoundStore.link.setSource(
		"capture",
		tag,
		screenKey,
		MEASURED_BOUNDS,
		{},
		[],
	);
};

const attachDestination = (
	tag: string,
	screenKey = DESTINATION_KEY,
	expectedSourceScreenKey = SOURCE_KEY,
) => {
	BoundStore.link.setDestination(
		"attach",
		tag,
		screenKey,
		MEASURED_BOUNDS,
		{},
		[],
		expectedSourceScreenKey,
	);
};

const getLifecycleBlockCount = (screenKey: string) =>
	SystemStore.getBag(screenKey).pendingLifecycleStartBlockCount.get();

function CaptureSourceHarness(props: {
	enabled: boolean;
	sharedBoundTag: string;
	id: string;
	group?: string;
	nextScreenKey?: string;
	measureBoundary: (options: MeasureParams) => void;
}) {
	useCaptureSourceBoundary(props);
	return null;
}

function CaptureDestinationHarness(props: {
	sharedBoundTag: string;
	enabled: boolean;
	id: string;
	group?: string;
	currentScreenKey: string;
	expectedSourceScreenKey?: string;
	measureBoundary: (options: MeasureParams) => void;
}) {
	useCaptureDestinationBoundary(props);
	return null;
}

function RefreshBoundaryHarness(props: {
	enabled: boolean;
	sharedBoundTag: string;
	id: string;
	group?: string;
	currentScreenKey: string;
	nextScreenKey?: string;
	hasNextScreen: boolean;
	measureBoundary: (options: MeasureParams) => void;
}) {
	useRefreshBoundary(props);
	return null;
}

describe("boundary measurement hooks", () => {
	let renderer: ReactTestRenderer | null = null;

	afterEach(() => {
		if (renderer) {
			act(() => {
				renderer?.unmount();
			});
			renderer = null;
		}
	});

	beforeEach(() => {
		(globalThis as any).resetMutableRegistry();
	});

	it("captures source once when the next screen appears", () => {
		const measureCalls: MeasureParams[] = [];

		act(() => {
			renderer = create(
				<CaptureSourceHarness
					enabled
					sharedBoundTag="avatar"
					id="1"
					nextScreenKey={DESTINATION_KEY}
					measureBoundary={(options) => {
						measureCalls.push(options);
					}}
				/>,
			);
		});

		expect(measureCalls).toEqual([{ intent: "capture-source" }]);

		act(() => {
			renderer?.update(
				<CaptureSourceHarness
					enabled
					sharedBoundTag="avatar"
					id="1"
					nextScreenKey={DESTINATION_KEY}
					measureBoundary={(options) => {
						measureCalls.push(options);
					}}
				/>,
			);
		});

		expect(measureCalls).toHaveLength(1);
	});

	it("skips source capture when the grouped member is not active", () => {
		const measureCalls: MeasureParams[] = [];
		BoundStore.group.setActiveId("feed", "2");

		act(() => {
			renderer = create(
				<CaptureSourceHarness
					enabled
					sharedBoundTag="feed:1"
					id="1"
					group="feed"
					nextScreenKey={DESTINATION_KEY}
					measureBoundary={(options) => {
						measureCalls.push(options);
					}}
				/>,
			);
		});

		expect(measureCalls).toHaveLength(0);
	});

	it("blocks lifecycle start and captures destination while a source link is attachable", () => {
		const tag = "hero";
		const measureCalls: MeasureParams[] = [];
		captureSource(tag);

		act(() => {
			renderer = create(
				<CaptureDestinationHarness
					sharedBoundTag={tag}
					enabled
					id="1"
					currentScreenKey={DESTINATION_KEY}
					expectedSourceScreenKey={SOURCE_KEY}
					measureBoundary={(options) => {
						measureCalls.push(options);
					}}
				/>,
			);
		});

		expect(measureCalls).toEqual([{ intent: "complete-destination" }]);
		expect(getLifecycleBlockCount(DESTINATION_KEY)).toBe(1);
	});

	it("releases the lifecycle block after destination attachment on rerender", () => {
		const tag = "poster";
		const measureCalls: MeasureParams[] = [];
		captureSource(tag);

		act(() => {
			renderer = create(
				<CaptureDestinationHarness
					sharedBoundTag={tag}
					enabled
					id="1"
					currentScreenKey={DESTINATION_KEY}
					expectedSourceScreenKey={SOURCE_KEY}
					measureBoundary={(options) => {
						measureCalls.push(options);
					}}
				/>,
			);
		});

		expect(getLifecycleBlockCount(DESTINATION_KEY)).toBe(1);

		attachDestination(tag);

		act(() => {
			renderer?.update(
				<CaptureDestinationHarness
					sharedBoundTag={tag}
					enabled
					id="1"
					currentScreenKey={DESTINATION_KEY}
					expectedSourceScreenKey={SOURCE_KEY}
					measureBoundary={(options) => {
						measureCalls.push(options);
					}}
				/>,
			);
		});

		expect(measureCalls).toHaveLength(1);
		expect(getLifecycleBlockCount(DESTINATION_KEY)).toBe(0);
	});

	it("releases the lifecycle block on unmount before destination attachment", () => {
		const tag = "card";
		captureSource(tag);

		act(() => {
			renderer = create(
				<CaptureDestinationHarness
					sharedBoundTag={tag}
					enabled
					id="1"
					currentScreenKey={DESTINATION_KEY}
					expectedSourceScreenKey={SOURCE_KEY}
					measureBoundary={() => {}}
				/>,
			);
		});

		expect(getLifecycleBlockCount(DESTINATION_KEY)).toBe(1);

		act(() => {
			renderer?.unmount();
			renderer = null;
		});

		expect(getLifecycleBlockCount(DESTINATION_KEY)).toBe(0);
	});

	it("does not block destination lifecycle start once the screen is already animating", () => {
		const tag = "sheet";
		const measureCalls: MeasureParams[] = [];
		captureSource(tag);
		AnimationStore.getValue(DESTINATION_KEY, "animating").set(1);

		act(() => {
			renderer = create(
				<CaptureDestinationHarness
					sharedBoundTag={tag}
					enabled
					id="1"
					currentScreenKey={DESTINATION_KEY}
					expectedSourceScreenKey={SOURCE_KEY}
					measureBoundary={(options) => {
						measureCalls.push(options);
					}}
				/>,
			);
		});

		expect(measureCalls).toHaveLength(0);
		expect(getLifecycleBlockCount(DESTINATION_KEY)).toBe(0);
	});

	it("chooses capture-source for pre-transition source measurement without an existing source link", () => {
		const measureCalls: MeasureParams[] = [];
		AnimationStore.getValue(DESTINATION_KEY, "willAnimate").set(1);

		act(() => {
			renderer = create(
				<RefreshBoundaryHarness
					enabled
					sharedBoundTag="tile"
					id="1"
					currentScreenKey={SOURCE_KEY}
					nextScreenKey={DESTINATION_KEY}
					hasNextScreen
					measureBoundary={(options) => {
						measureCalls.push(options);
					}}
				/>,
			);
		});

		expect(measureCalls).toEqual([{ intent: "capture-source" }]);
	});

	it("chooses refresh-source for grouped pre-transition measurement when a source link exists", () => {
		const tag = "feed:1";
		const measureCalls: MeasureParams[] = [];
		AnimationStore.getValue(DESTINATION_KEY, "willAnimate").set(1);
		BoundStore.group.setActiveId("feed", "1");
		captureSource(tag);

		act(() => {
			renderer = create(
				<RefreshBoundaryHarness
					enabled
					sharedBoundTag={tag}
					id="1"
					group="feed"
					currentScreenKey={SOURCE_KEY}
					nextScreenKey={DESTINATION_KEY}
					hasNextScreen
					measureBoundary={(options) => {
						measureCalls.push(options);
					}}
				/>,
			);
		});

		expect(measureCalls).toEqual([{ intent: "refresh-source" }]);
	});

	it("requests destination completion and refresh before an entering screen animates", () => {
		const measureCalls: MeasureParams[] = [];
		AnimationStore.getValue(DESTINATION_KEY, "willAnimate").set(1);
		GestureStore.getValue(DESTINATION_KEY, "dragging").set(0);
		AnimationStore.getValue(DESTINATION_KEY, "animating").set(0);

		act(() => {
			renderer = create(
				<RefreshBoundaryHarness
					enabled
					sharedBoundTag="modal"
					id="1"
					currentScreenKey={DESTINATION_KEY}
					hasNextScreen={false}
					measureBoundary={(options) => {
						measureCalls.push(options);
					}}
				/>,
			);
		});

		expect(measureCalls).toEqual([
			{ intent: ["complete-destination", "refresh-destination"] },
		]);
	});
});
