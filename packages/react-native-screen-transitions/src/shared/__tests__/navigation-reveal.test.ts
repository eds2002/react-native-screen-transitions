import { beforeEach, describe, expect, it } from "bun:test";
import {
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
	createScreenTransitionState,
} from "../constants";
import type { BoundsInterpolationProps } from "../types/bounds.types";
import type { Layout } from "../types/screen.types";
import { buildRevealStyles } from "../utils/bounds/navigation/reveal/build";
import {
	createBounds,
	registerSourceAndDestination,
	refreshDestination,
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

const makeState = (key: string, navigationMaskEnabled = false) => ({
	...createScreenTransitionState({ key } as any, undefined, navigationMaskEnabled),
	route: { key } as any,
	layouts: { screen: screenLayout, navigationMaskEnabled },
});

const makeProps = (): BoundsInterpolationProps => {
	const previous = makeState("list");
	const current = {
		...makeState("detail", true),
		entering: 1,
		animating: 1,
	};

	return {
		previous,
		current,
		next: undefined,
		layouts: { screen: screenLayout, navigationMaskEnabled: true },
		insets: zeroInsets,
		focused: true,
		progress: 1,
		stackProgress: 1,
		logicallySettled: current.logicallySettled,
		active: current,
		inactive: previous,
	};
};

const makeDraggingProps = (normY: number): BoundsInterpolationProps => {
	const previous = makeState("list");
	const baseCurrent = makeState("detail", true);
	const dragY = normY * screenLayout.height;
	const current = {
		...baseCurrent,
		entering: 1,
		animating: 1,
		progress: 0.5,
		gesture: {
			...baseCurrent.gesture,
			active: "vertical" as const,
			direction: "vertical" as const,
			y: dragY,
			normY,
			raw: {
				...baseCurrent.gesture.raw,
				y: dragY,
				normY,
			},
		},
	};

	return {
		previous,
		current,
		next: undefined,
		layouts: { screen: screenLayout, navigationMaskEnabled: true },
		insets: zeroInsets,
		focused: true,
		progress: 0.5,
		stackProgress: 0.5,
		logicallySettled: current.logicallySettled,
		active: current,
		inactive: previous,
	};
};

const makeDismissingDragProps = ({
	progress,
	normY,
}: {
	progress: number;
	normY: number;
}): BoundsInterpolationProps => {
	const previous = makeState("list");
	const baseCurrent = makeState("detail", true);
	const dragY = normY * screenLayout.height;
	const current = {
		...baseCurrent,
		closing: 1,
		entering: 0,
		animating: 1,
		progress,
		gesture: {
			...baseCurrent.gesture,
			active: "vertical" as const,
			direction: "vertical" as const,
			dismissing: 1,
			y: 0,
			normY,
			raw: {
				...baseCurrent.gesture.raw,
				y: dragY,
				normY,
			},
		},
	};

	return {
		previous,
		current,
		next: undefined,
		layouts: { screen: screenLayout, navigationMaskEnabled: true },
		insets: zeroInsets,
		focused: true,
		progress,
		stackProgress: progress,
		logicallySettled: current.logicallySettled,
		active: current,
		inactive: previous,
	};
};

const makeResettingDragProps = (normY: number): BoundsInterpolationProps => {
	const previous = makeState("list");
	const baseCurrent = makeState("detail", true);
	const dragY = normY * screenLayout.height;
	const current = {
		...baseCurrent,
		entering: 1,
		animating: 1,
		progress: 1,
		gesture: {
			...baseCurrent.gesture,
			active: "vertical" as const,
			direction: "vertical" as const,
			settling: 1,
			y: dragY,
			normY,
			raw: {
				...baseCurrent.gesture.raw,
				y: 0,
				normY: 0,
			},
		},
	};

	return {
		previous,
		current,
		next: undefined,
		layouts: { screen: screenLayout, navigationMaskEnabled: true },
		insets: zeroInsets,
		focused: true,
		progress: 1,
		stackProgress: 1,
		logicallySettled: current.logicallySettled,
		active: current,
		inactive: previous,
	};
};

const makeHorizontalDraggingProps = (normX: number): BoundsInterpolationProps => {
	const previous = makeState("list");
	const baseCurrent = makeState("detail", true);
	const dragX = normX * screenLayout.width;
	const current = {
		...baseCurrent,
		entering: 1,
		animating: 1,
		progress: 0.5,
		gesture: {
			...baseCurrent.gesture,
			active: "horizontal" as const,
			direction: "horizontal" as const,
			x: dragX,
			normX,
			raw: {
				...baseCurrent.gesture.raw,
				x: dragX,
				normX,
			},
		},
	};

	return {
		previous,
		current,
		next: undefined,
		layouts: { screen: screenLayout, navigationMaskEnabled: true },
		insets: zeroInsets,
		focused: true,
		progress: 0.5,
		stackProgress: 0.5,
		logicallySettled: current.logicallySettled,
		active: current,
		inactive: previous,
	};
};

const makeClosingProps = (): BoundsInterpolationProps => {
	const current = {
		...makeState("detail", true),
		closing: 1,
		entering: 0,
		animating: 1,
		progress: 0.5,
	};
	const next = makeState("list");

	return {
		previous: undefined,
		current,
		next,
		layouts: { screen: screenLayout, navigationMaskEnabled: true },
		insets: zeroInsets,
		focused: true,
		progress: 0.5,
		stackProgress: 0.5,
		logicallySettled: current.logicallySettled,
		active: current,
		inactive: next,
	};
};

const getMaskTransformValue = (
	styles: ReturnType<typeof buildRevealStyles>,
	key: string,
) => {
	const transform = styles[NAVIGATION_MASK_ELEMENT_STYLE_ID]?.style
		?.transform as Record<string, number>[] | undefined;

	return transform?.find((entry) => key in entry)?.[key] ?? 0;
};

const getMaskStyleValue = (
	styles: ReturnType<typeof buildRevealStyles>,
	key: string,
) =>
	(styles[NAVIGATION_MASK_ELEMENT_STYLE_ID]?.style as
		| Record<string, number>
		| undefined)?.[key] ?? 0;

const getContentTransformValue = (
	styles: ReturnType<typeof buildRevealStyles>,
	key: string,
) => {
	const transform = styles.content?.style?.transform as
		| Record<string, number>[]
		| undefined;

	return transform?.find((entry) => key in entry)?.[key] ?? 0;
};

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("navigation reveal", () => {
	it("builds reveal styles through the local bounds accessor", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "list",
			destinationScreenKey: "detail",
			sourceBounds: createBounds(20, 30, 120, 160),
			destinationBounds: createBounds(0, 0, 400, 800),
		});

		const styles = buildRevealStyles({
			tag: "card",
			props: makeProps(),
		});

		expect(styles.content?.style?.transform).toBeArray();
		expect(styles.card?.style?.zIndex).toBe(999);
		expect(styles.card?.style?.transform).toEqual([
			{ translateX: 0 },
			{ translateY: 0 },
		]);
		expect(styles[NAVIGATION_MASK_ELEMENT_STYLE_ID]?.style?.width).toBe(
			screenLayout.width,
		);
	});

	it("keeps focused mask compensation stable while drag scale changes", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "list",
			destinationScreenKey: "detail",
			sourceBounds: createBounds(20, 80, 120, 160),
			destinationBounds: createBounds(80, 220, 180, 240),
		});

		const restingStyles = buildRevealStyles({
			tag: "card",
			props: makeHorizontalDraggingProps(0),
		});

		const draggedStyles = buildRevealStyles({
			tag: "card",
			props: makeHorizontalDraggingProps(0.5),
		});

		expect(getMaskTransformValue(draggedStyles, "translateY")).toBeCloseTo(
			getMaskTransformValue(restingStyles, "translateY"),
			5,
		);
		expect(getMaskTransformValue(draggedStyles, "scale")).toBeCloseTo(
			getMaskTransformValue(restingStyles, "scale"),
			5,
		);
	});

	it("shrinks focused mask height toward a square during vertical drag", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "list",
			destinationScreenKey: "detail",
			sourceBounds: createBounds(20, 80, 120, 160),
			destinationBounds: createBounds(80, 220, 180, 240),
		});

		const restingStyles = buildRevealStyles({
			tag: "card",
			props: makeDraggingProps(0),
		});

		const draggedStyles = buildRevealStyles({
			tag: "card",
			props: makeDraggingProps(0.35),
		});

		const fullyDraggedStyles = buildRevealStyles({
			tag: "card",
			props: makeDraggingProps(1),
		});

		expect(getMaskStyleValue(draggedStyles, "height")).toBeLessThan(
			getMaskStyleValue(restingStyles, "height"),
		);
		expect(getMaskStyleValue(fullyDraggedStyles, "height")).toBeCloseTo(
			getMaskStyleValue(fullyDraggedStyles, "width"),
			5,
		);
	});

	it("hands focused mask height collapse from release drag to close progress", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "list",
			destinationScreenKey: "detail",
			sourceBounds: createBounds(20, 80, 120, 160),
			destinationBounds: createBounds(80, 220, 180, 240),
		});

		const releaseStyles = buildRevealStyles({
			tag: "card",
			props: makeDismissingDragProps({ progress: 1, normY: 0.35 }),
		});

		const closingStyles = buildRevealStyles({
			tag: "card",
			props: makeDismissingDragProps({ progress: 0.4, normY: 0.35 }),
		});

		expect(getMaskStyleValue(closingStyles, "height")).toBeLessThanOrEqual(
			getMaskStyleValue(releaseStyles, "height"),
		);
	});

	it("expands focused mask height smoothly from live gesture reset values", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "list",
			destinationScreenKey: "detail",
			sourceBounds: createBounds(20, 80, 120, 160),
			destinationBounds: createBounds(80, 220, 180, 240),
		});

		const restingStyles = buildRevealStyles({
			tag: "card",
			props: makeResettingDragProps(0),
		});

		const resettingStyles = buildRevealStyles({
			tag: "card",
			props: makeResettingDragProps(0.35),
		});

		expect(getMaskStyleValue(resettingStyles, "height")).toBeLessThan(
			getMaskStyleValue(restingStyles, "height"),
		);
	});

	it("lands focused dismiss scale on the source size after drag-scale handoff", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "list",
			destinationScreenKey: "detail",
			sourceBounds: createBounds(20, 80, 120, 160),
			destinationBounds: createBounds(80, 220, 180, 240),
		});

		const restingTargetStyles = buildRevealStyles({
			tag: "card",
			props: makeDismissingDragProps({ progress: 0, normY: 0 }),
		});

		const draggedTargetStyles = buildRevealStyles({
			tag: "card",
			props: makeDismissingDragProps({ progress: 0, normY: 0.6 }),
		});

		expect(getContentTransformValue(draggedTargetStyles, "scale")).toBeCloseTo(
			getContentTransformValue(restingTargetStyles, "scale"),
			5,
		);
	});

	it("adds a release scale dip without changing the final source match", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "list",
			destinationScreenKey: "detail",
			sourceBounds: createBounds(20, 80, 120, 160),
			destinationBounds: createBounds(0, 0, 400, 800),
		});

		const releaseStyles = buildRevealStyles({
			tag: "card",
			props: makeDismissingDragProps({ progress: 1, normY: 0.7 }),
		});

		const middleStyles = buildRevealStyles({
			tag: "card",
			props: makeDismissingDragProps({ progress: 0.5, normY: 0.7 }),
		});

		const targetStyles = buildRevealStyles({
			tag: "card",
			props: makeDismissingDragProps({ progress: 0, normY: 0.7 }),
		});

		const restingTargetStyles = buildRevealStyles({
			tag: "card",
			props: makeDismissingDragProps({ progress: 0, normY: 0 }),
		});

		const releaseScale = getContentTransformValue(releaseStyles, "scale");
		const middleScale = getContentTransformValue(middleStyles, "scale");
		const targetScale = getContentTransformValue(targetStyles, "scale");
		const restingTargetScale = getContentTransformValue(
			restingTargetStyles,
			"scale",
		);
		const linearMiddleScale = targetScale + (releaseScale - targetScale) * 0.5;

		expect(middleScale).toBeLessThan(linearMiddleScale);
		expect(targetScale).toBeCloseTo(restingTargetScale, 5);
	});

	it("compensates refreshed destination movement while closing", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "list",
			destinationScreenKey: "detail",
			sourceBounds: createBounds(20, 30, 120, 160),
			destinationBounds: createBounds(0, 0, 400, 800),
		});

		const openingStyles = buildRevealStyles({
			tag: "card",
			props: makeProps(),
		});

		refreshDestination({
			tag: "card",
			destinationScreenKey: "detail",
			destinationBounds: createBounds(0, 80, 400, 800),
		});

		const closingStyles = buildRevealStyles({
			tag: "card",
			props: makeClosingProps(),
		});

		expect(openingStyles.card?.style?.transform).toEqual([
			{ translateX: 0 },
			{ translateY: 0 },
		]);
		expect(closingStyles.card?.style?.transform).toEqual([
			{ translateX: 0 },
			{ translateY: -40 },
		]);
	});
});
