import { beforeEach, describe, expect, it } from "bun:test";
import {
	createScreenTransitionState,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../constants";
import { BoundStore } from "../../stores/bounds";
import { createScreenPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";
import type { BoundsInterpolationProps } from "../../types/bounds.types";
import type { Layout } from "../../types/screen.types";
import { createBoundsAccessor } from "../../utils/bounds";
import {
	createBounds,
	registerMeasuredEntry,
	registerSourceAndDestination,
	setDestination,
} from "./helpers/bounds-behavior-fixtures";

const screenLayout = {
	width: 400,
	height: 800,
	scale: 1,
	fontScale: 1,
} satisfies Layout;

const zeroInsets = {
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
} as const;

const makeState = (key: string) => ({
	...createScreenTransitionState({ key } as any),
	route: { key } as any,
	layouts: { screen: screenLayout },
});

const makeProps = (): BoundsInterpolationProps => {
	const previous = makeState("screen-a");
	const current = {
		...makeState("screen-b"),
		entering: 1,
		animating: 1,
	};

	return {
		previous,
		current,
		next: undefined,
		layouts: { screen: screenLayout },
		insets: zeroInsets,
		focused: true,
		progress: 0,
		stackProgress: 0,
		snapIndex: current.snapIndex,
		logicallySettled: current.logicallySettled,
		active: current,
		inactive: previous,
	};
};

const makeFocusedProgressProps = (progress: number): BoundsInterpolationProps => {
	const props = makeProps();
	const current = {
		...props.current,
		progress,
		settled: 0,
	};

	return {
		...props,
		current,
		active: current,
		progress,
	};
};

const makeVerticalDragProps = (): BoundsInterpolationProps => {
	const props = makeProps();
	const current = {
		...props.current,
		progress: 1,
		entering: 0,
		animating: 1,
		settled: 0,
		logicallySettled: 0,
		gesture: {
			...props.active.gesture,
			y: screenLayout.height,
			normY: 1,
			raw: {
				...props.active.gesture.raw,
				y: screenLayout.height,
				normY: 1,
			},
			dragging: 1,
			active: "vertical" as const,
			direction: "vertical" as const,
		},
	};

	return {
		...props,
		current,
		active: current,
		progress: 1,
		snapIndex: current.snapIndex,
		logicallySettled: current.logicallySettled,
	};
};

const makeUnfocusedRevealProps = (): BoundsInterpolationProps => {
	const props = makeProps();
	const active = {
		...props.current,
		progress: 0.1,
		entering: 1,
		animating: 1,
		settled: 0,
		logicallySettled: 0,
	};

	return {
		...props,
		focused: false,
		active,
		current: active,
		inactive: props.previous,
		progress: 0.1,
		snapIndex: active.snapIndex,
		logicallySettled: active.logicallySettled,
	};
};

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("bounds accessor", () => {
	it('preserves public `space: "absolute"` requests', () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(10, 20, 100, 200),
			destinationBounds: createBounds(50, 100, 200, 400),
		});

		const bounds = createBoundsAccessor(makeProps);
		const styles = bounds({
			id: "card",
			method: "size",
			space: "absolute",
			raw: true,
		});

		expect(styles.translateX).toBe(10);
		expect(styles.translateY).toBe(20);
		expect(styles.width).toBe(100);
		expect(styles.height).toBe(200);
	});

	it("keeps deprecated `gestures` as an offset alias", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(10, 20, 100, 200),
			destinationBounds: createBounds(50, 100, 200, 400),
		});

		const bounds = createBoundsAccessor(makeProps);
		const styles = bounds({
			id: "card",
			gestures: { x: 12, y: -8 },
		}) as any;

		expect(styles.transform[0]).toEqual({ translateX: 12 });
		expect(styles.transform[1]).toEqual({ translateY: -8 });
	});

	it("forces navigation masking for reveal transitions", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(10, 20, 100, 200),
			destinationBounds: createBounds(50, 100, 200, 400),
		});

		const bounds = createBoundsAccessor(() => makeFocusedProgressProps(1));
		const reveal = bounds({ id: "card" }).navigation.reveal();

		expect(reveal.options?.navigationMaskEnabled).toBe(true);
		expect(reveal.options?.gestureProgressMode).toBe("freeform");
	});

	it("maps reveal options onto runtime transition options", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(10, 20, 100, 200),
			destinationBounds: createBounds(50, 100, 200, 400),
		});

		const bounds = createBoundsAccessor(makeProps);
		const reveal = bounds({ id: "card" }).navigation.reveal({
			maxSensitivity: 0.4,
			gestureProgressMode: "progress-driven",
		});

		expect(reveal.options?.gestureSensitivity).toBe(0.4);
		expect(reveal.options?.gestureProgressMode).toBe("progress-driven");
	});

	it("applies reveal mask shape options", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(10, 20, 100, 200),
			destinationBounds: createBounds(50, 100, 200, 400),
		});

		const bounds = createBoundsAccessor(() => makeFocusedProgressProps(1));
		const reveal = bounds({ id: "card" }).navigation.reveal({
			borderRadius: 44,
			borderContinuous: false,
			maskSizingMode: "size",
		});
		const maskStyle = reveal[NAVIGATION_MASK_ELEMENT_STYLE_ID]?.style as {
			borderRadius: number;
			borderCurve?: "continuous";
			width: number;
			height: number;
		};

		expect(maskStyle.borderRadius).toBe(44);
		expect(maskStyle.borderCurve).toBeUndefined();
		expect(maskStyle.width).toBe(screenLayout.width);
		expect(maskStyle.height).toBe(screenLayout.height);
	});

	it("can opt out of reveal's pointer-event handoff guard", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(10, 20, 100, 200),
			destinationBounds: createBounds(50, 100, 200, 400),
		});

		const bounds = createBoundsAccessor(makeUnfocusedRevealProps);
		const guarded = bounds({ id: "card" }).navigation.reveal();
		const unguarded = bounds({ id: "card" }).navigation.reveal({
			disablePointerEventsTillElementTransition: false,
		});

		expect((guarded.content as any).props.pointerEvents).toBe("auto");
		expect((unguarded.content as any).props).toBeUndefined();
	});

	it("collapses reveal navigation masks to the source aspect ratio", () => {
		registerSourceAndDestination({
			tag: "poster",
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(10, 20, 90, 160),
			destinationBounds: createBounds(50, 100, 320, 568),
		});

		const bounds = createBoundsAccessor(makeVerticalDragProps);
		const reveal = bounds({ id: "poster" }).navigation.reveal();
		const maskStyle = reveal[NAVIGATION_MASK_ELEMENT_STYLE_ID]?.style as {
			width: number;
			height: number;
		};

		expect(maskStyle.width).toBe(screenLayout.width);
		expect(maskStyle.height).toBeCloseTo(
			screenLayout.width * (160 / 90),
			5,
		);
	});

	it("prefers `offset` over deprecated `gestures` per axis", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(10, 20, 100, 200),
			destinationBounds: createBounds(50, 100, 200, 400),
		});

		const bounds = createBoundsAccessor(makeProps);
		const styles = bounds({
			id: "card",
			offset: { x: 3 },
			gestures: { x: 12, y: -8 },
		}) as any;

		expect(styles.transform[0]).toEqual({ translateX: 3 });
		expect(styles.transform[1]).toEqual({ translateY: -8 });
	});

	it("resolves grouped links only from the requested concrete id", () => {
		registerSourceAndDestination({
			tag: "photos:1",
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(10, 20, 100, 200),
			destinationBounds: createBounds(50, 100, 200, 400),
		});
		registerSourceAndDestination({
			tag: "photos:2",
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(20, 30, 120, 220),
			destinationBounds: createBounds(60, 110, 240, 440),
		});

		const bounds = createBoundsAccessor(makeProps);

		const initial = bounds.getLink("photos:1");

		expect(initial?.id).toBe("photos:1");

		expect(bounds.getLink("photos:1")?.id).toBe("photos:1");

		expect(bounds.getLink("photos:missing")).toBeNull();
	});

	it("syncs pair-local group active id from bounds options", () => {
		const bounds = createBoundsAccessor(makeProps);

		bounds({
			id: "2",
			group: "photos",
		});

		expect(
			BoundStore.link.getActiveGroupId(
				createScreenPairKey("screen-a", "screen-b"),
				"photos",
			),
		).toBe("2");
	});

	it("keeps initial destination side on refreshed destination links", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(10, 20, 100, 200),
			destinationBounds: createBounds(50, 100, 200, 400),
		});
		setDestination({
			tag: "card",
			destinationScreenKey: "screen-b",
			destinationBounds: createBounds(70, 120, 200, 400),
		});

		const bounds = createBoundsAccessor(makeProps);
		const link = bounds.getLink("card");

		expect(link?.source?.bounds.pageX).toBe(10);
		expect(link?.initialSource?.bounds.pageX).toBe(10);
		expect(link?.destination?.bounds.pageX).toBe(70);
		expect(link?.initialDestination?.bounds.pageX).toBe(50);
	});

	it("does not fall back to the initial group member while group linkage is disabled", () => {
		registerSourceAndDestination({
			tag: "photos:1",
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(10, 20, 100, 200),
			destinationBounds: createBounds(50, 100, 200, 400),
		});

		const bounds = createBoundsAccessor(makeProps);

		const fallback = bounds.getLink("photos:missing");

		expect(fallback).toBeNull();
	});

	it("falls back to the pair-local initial group member for missing requested ids", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const source = createBounds(10, 20, 100, 200);
		const destination = createBounds(50, 100, 200, 400);

		BoundStore.link.setSource(pairKey, "1", "screen-a", source, {}, "photos");
		BoundStore.link.setDestination(
			pairKey,
			"1",
			"screen-b",
			destination,
			{},
			"photos",
		);
		BoundStore.link.setActiveGroupId(pairKey, "photos", "4");

		const bounds = createBoundsAccessor(makeProps);
		const fallback = bounds.getLink("photos:4");

		expect(fallback?.id).toBe("photos:1");
		expect(fallback?.source?.bounds.pageX).toBe(10);
	});

	it("scopes low-level helpers to a computed bounds result", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(10, 20, 100, 200),
			destinationBounds: createBounds(50, 100, 200, 400),
		});
		registerMeasuredEntry("card", "screen-b", createBounds(4, 8, 16, 32));
		setDestination({
			tag: "card",
			destinationScreenKey: "screen-b",
			destinationBounds: createBounds(70, 120, 200, 400),
		});

		const bounds = createBoundsAccessor(makeProps);
		const card = bounds({ id: "card" });

		expect(card.getLink()?.destination?.bounds.pageX).toBe(70);
		expect(card.getMeasured("screen-b")?.bounds.pageX).toBe(4);
		expect(card.getSnapshot("screen-b")?.bounds.pageX).toBe(4);
		expect(typeof card.interpolateStyle).toBe("function");
		expect(typeof card.interpolateBounds).toBe("function");
	});
});
