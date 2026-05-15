import { beforeEach, describe, expect, it } from "bun:test";
import {
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
	createScreenTransitionState,
} from "../../constants";
import type {
	ScreenInterpolationProps,
	ScreenTransitionState,
} from "../../types/animation.types";
import type { GestureValues } from "../../types/gesture.types";
import type { Layout } from "../../types/screen.types";
import { buildRevealStyles } from "../../utils/bounds/navigation/reveal/build";
import { CLOSE_SOURCE_HANDOFF_PROGRESS } from "../../utils/bounds/navigation/reveal/config";
import {
	createBounds,
	registerSourceAndDestination,
	refreshDestination,
} from "../helpers/bounds-behavior-fixtures";

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

const sourceBounds = createBounds(40, 120, 100, 120);
const destinationBounds = createBounds(80, 160, 240, 320);

const getTransformValue = (
	transform: Array<Record<string, number>> | undefined,
	key: string,
	fallback = 0,
) => transform?.find((entry) => key in entry)?.[key] ?? fallback;

const resolveFocusedDestinationRect = (
	styles: ReturnType<typeof buildRevealStyles>,
	destinationBaseBounds = destinationBounds,
) => {
	const contentTransform = styles.content?.style?.transform as
		| Array<Record<string, number>>
		| undefined;
	const elementTransform = styles.card?.style?.transform as
		| Array<Record<string, number>>
		| undefined;

	const contentTranslateX = getTransformValue(contentTransform, "translateX");
	const contentTranslateY = getTransformValue(contentTransform, "translateY");
	const contentScale = getTransformValue(contentTransform, "scale", 1);
	const elementTranslateX = getTransformValue(elementTransform, "translateX");
	const elementTranslateY = getTransformValue(elementTransform, "translateY");
	const screenCenterX = screenLayout.width / 2;
	const screenCenterY = screenLayout.height / 2;
	const destinationCenterX =
		destinationBaseBounds.pageX +
		elementTranslateX +
		destinationBaseBounds.width / 2;
	const destinationCenterY =
		destinationBaseBounds.pageY +
		elementTranslateY +
		destinationBaseBounds.height / 2;

	return {
		centerX:
			screenCenterX +
			(destinationCenterX - screenCenterX) * contentScale +
			contentTranslateX,
		centerY:
			screenCenterY +
			(destinationCenterY - screenCenterY) * contentScale +
			contentTranslateY,
		width: destinationBaseBounds.width * contentScale,
		height: destinationBaseBounds.height * contentScale,
	};
};

const resolveUnfocusedSourceRect = (
	styles: ReturnType<typeof buildRevealStyles>,
) => {
	const contentTransform = styles.content?.style?.transform as
		| Array<Record<string, number>>
		| undefined;
	const elementTransform = styles.card?.style?.transform as
		| Array<Record<string, number>>
		| undefined;

	const parentScale = getTransformValue(contentTransform, "scale", 1);
	const elementTranslateX = getTransformValue(elementTransform, "translateX");
	const elementTranslateY = getTransformValue(elementTransform, "translateY");
	const elementScaleX = getTransformValue(elementTransform, "scaleX", 1);
	const elementScaleY = getTransformValue(elementTransform, "scaleY", 1);
	const screenCenterX = screenLayout.width / 2;
	const screenCenterY = screenLayout.height / 2;
	const sourceCenterX =
		sourceBounds.pageX + elementTranslateX + sourceBounds.width / 2;
	const sourceCenterY =
		sourceBounds.pageY + elementTranslateY + sourceBounds.height / 2;

	return {
		centerX: screenCenterX + (sourceCenterX - screenCenterX) * parentScale,
		centerY: screenCenterY + (sourceCenterY - screenCenterY) * parentScale,
		width: sourceBounds.width * elementScaleX * parentScale,
		height: sourceBounds.height * elementScaleY * parentScale,
	};
};

const createGesture = (
	overrides: Partial<GestureValues> = {},
): GestureValues => {
	const base = createScreenTransitionState({ key: "gesture" } as any).gesture;

	return {
		...base,
		...overrides,
		raw: {
			...base.raw,
			...(overrides.raw ?? {}),
		},
	};
};

const createState = ({
	key,
	progress,
	closing = 0,
	gesture,
}: {
	key: string;
	progress: number;
	closing?: number;
	gesture?: Partial<GestureValues>;
}): ScreenTransitionState => {
	const state = createScreenTransitionState({ key } as any);
	state.progress = progress;
	state.closing = closing;
	state.entering = closing ? 0 : state.entering;
	state.animating = closing ? 1 : state.animating;
	state.settled = closing ? 0 : state.settled;
	state.logicallySettled = closing ? 0 : state.logicallySettled;
	state.layouts.screen = screenLayout;
	state.gesture = createGesture(gesture);

	return state;
};

const createFocusedProps = (
	destinationProgress: number,
	gesture?: Partial<GestureValues>,
): ScreenInterpolationProps => {
	const previous = createState({ key: "source", progress: 1 });
	const current = createState({
		key: "destination",
		progress: destinationProgress,
		closing: 1,
		gesture,
	});

	return {
		previous,
		current,
		next: undefined,
		layouts: { screen: screenLayout },
		insets: zeroInsets,
		focused: true,
		progress: destinationProgress,
		stackProgress: destinationProgress,
		logicallySettled: current.logicallySettled,
		active: current,
		inactive: previous,
		bounds: undefined as any,
		transition: undefined as any,
	};
};

const createUnfocusedProps = (
	destinationProgress: number,
	gesture?: Partial<GestureValues>,
): ScreenInterpolationProps => {
	const current = createState({ key: "source", progress: 1 });
	const next = createState({
		key: "destination",
		progress: destinationProgress,
		closing: 1,
		gesture,
	});

	return {
		previous: undefined,
		current,
		next,
		layouts: { screen: screenLayout },
		insets: zeroInsets,
		focused: false,
		progress: current.progress + next.progress,
		stackProgress: current.progress + next.progress,
		logicallySettled: next.logicallySettled,
		active: next,
		inactive: current,
		bounds: undefined as any,
		transition: undefined as any,
	};
};

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
	registerSourceAndDestination({
		tag: "card",
		sourceScreenKey: "source",
		destinationScreenKey: "destination",
		sourceBounds,
		destinationBounds,
	});
});

describe("navigation reveal close handoff", () => {
	it("fades focused content in during the close handoff window", () => {
		const styles = buildRevealStyles({
			tag: "card",
			props: createFocusedProps(CLOSE_SOURCE_HANDOFF_PROGRESS / 2),
		});

		expect(styles.content?.style?.opacity).toBeCloseTo(0.5);
	});

	it("shrinks the focused mask during close", () => {
		const styles = buildRevealStyles({
			tag: "card",
			props: createFocusedProps(0.5),
		});

		const maskStyle = styles[NAVIGATION_MASK_ELEMENT_STYLE_ID]?.style as any;

		expect(maskStyle.width).toBeCloseTo(237.5);
		expect(maskStyle.height).toBeCloseTo(437);
	});

	it("keeps mask collapse continuous when a freeform drag starts dismissing", () => {
		const gesture = {
			active: "vertical",
			direction: "vertical",
			normY: 0.2,
			y: 160,
			raw: {
				...createGesture().raw,
				normY: 0.5,
				y: 400,
			},
		} satisfies Partial<GestureValues>;
		const draggingStyles = buildRevealStyles({
			tag: "card",
			props: createFocusedProps(1, gesture),
		});
		const dismissingStyles = buildRevealStyles({
			tag: "card",
			props: createFocusedProps(1, {
				...gesture,
				dismissing: 1,
			}),
		});
		const draggingMaskStyle = draggingStyles[
			NAVIGATION_MASK_ELEMENT_STYLE_ID
		]?.style as any;
		const dismissingMaskStyle = dismissingStyles[
			NAVIGATION_MASK_ELEMENT_STYLE_ID
		]?.style as any;

		expect(dismissingMaskStyle.height).toBeCloseTo(draggingMaskStyle.height);
	});

	it("shrinks the focused mask height during horizontal drags", () => {
		const restingStyles = buildRevealStyles({
			tag: "card",
			props: createFocusedProps(1),
		});
		const verticalDraggingStyles = buildRevealStyles({
			tag: "card",
			props: createFocusedProps(1, {
				active: "vertical",
				direction: "vertical",
				normY: 0.35,
				y: 280,
				raw: {
					...createGesture().raw,
					normY: 0.35,
					y: 280,
				},
			}),
		});
		const draggingStyles = buildRevealStyles({
			tag: "card",
			props: createFocusedProps(1, {
				active: "horizontal",
				direction: "horizontal",
				normX: 0.35,
				x: 140,
				raw: {
					...createGesture().raw,
					normX: 0.35,
					x: 140,
				},
			}),
		});
		const restingMaskStyle = restingStyles[NAVIGATION_MASK_ELEMENT_STYLE_ID]
			?.style as any;
		const verticalDraggingMaskStyle = verticalDraggingStyles[
			NAVIGATION_MASK_ELEMENT_STYLE_ID
		]?.style as any;
		const draggingMaskStyle = draggingStyles[NAVIGATION_MASK_ELEMENT_STYLE_ID]
			?.style as any;

		expect(draggingMaskStyle.width).toBeCloseTo(restingMaskStyle.width);
		expect(draggingMaskStyle.height).toBeLessThan(restingMaskStyle.height);
		expect(draggingMaskStyle.height).toBeGreaterThan(
			verticalDraggingMaskStyle.height,
		);
	});

	it("keeps horizontal mask collapse continuous when a freeform drag starts dismissing", () => {
		const gesture = {
			active: "horizontal",
			direction: "horizontal",
			normX: 0.2,
			x: 80,
			raw: {
				...createGesture().raw,
				normX: 0.5,
				x: 200,
			},
		} satisfies Partial<GestureValues>;
		const draggingStyles = buildRevealStyles({
			tag: "card",
			props: createFocusedProps(1, gesture),
		});
		const dismissingStyles = buildRevealStyles({
			tag: "card",
			props: createFocusedProps(1, {
				...gesture,
				dismissing: 1,
			}),
		});
		const draggingMaskStyle = draggingStyles[
			NAVIGATION_MASK_ELEMENT_STYLE_ID
		]?.style as any;
		const dismissingMaskStyle = dismissingStyles[
			NAVIGATION_MASK_ELEMENT_STYLE_ID
		]?.style as any;

		expect(dismissingMaskStyle.height).toBeCloseTo(draggingMaskStyle.height);
	});

	it("resolves dismiss scale back to the source by close completion", () => {
		const gesture = {
			active: "vertical",
			direction: "vertical",
			dismissing: 1,
			normY: 0.45,
			y: 220,
			raw: {
				...createGesture().raw,
				normY: 0.45,
				y: 220,
			},
		} satisfies Partial<GestureValues>;
		const sourceContentScale = Math.max(
			sourceBounds.width / destinationBounds.width,
			sourceBounds.height / destinationBounds.height,
		);

		const handoffStyles = buildRevealStyles({
			tag: "card",
			props: createFocusedProps(CLOSE_SOURCE_HANDOFF_PROGRESS, gesture),
		});
		const handoffContentTransform = handoffStyles.content?.style?.transform as
			| Array<Record<string, number>>
			| undefined;

		expect(getTransformValue(handoffContentTransform, "scale", 1)).toBeLessThan(
			sourceContentScale,
		);

		const settledStyles = buildRevealStyles({
			tag: "card",
			props: createFocusedProps(0, gesture),
		});
		const settledContentTransform = settledStyles.content?.style?.transform as
			| Array<Record<string, number>>
			| undefined;

		expect(
			getTransformValue(settledContentTransform, "scale", 1),
		).toBeCloseTo(sourceContentScale);
	});

	it("tracks the focused destination element with the unfocused source element", () => {
		const progress = 0.5;
		const gesture = {
			active: "vertical",
			direction: "vertical",
			normY: 0.35,
			y: 180,
			raw: {
				...createGesture().raw,
				normY: 0.35,
				y: 180,
			},
		} satisfies Partial<GestureValues>;
		const focusedStyles = buildRevealStyles({
			tag: "card",
			props: createFocusedProps(progress, gesture),
		});
		const unfocusedStyles = buildRevealStyles({
			tag: "card",
			props: createUnfocusedProps(progress, gesture),
		});
		const focusedRect = resolveFocusedDestinationRect(focusedStyles);
		const unfocusedRect = resolveUnfocusedSourceRect(unfocusedStyles);

		expect(unfocusedRect.centerX).toBeCloseTo(focusedRect.centerX);
		expect(unfocusedRect.centerY).toBeCloseTo(focusedRect.centerY);
		expect(unfocusedRect.width).toBeCloseTo(focusedRect.width);
		expect(unfocusedRect.height).toBeCloseTo(focusedRect.height);
	});

	it("keeps source tracking pinned to the initial destination after destination refresh", () => {
		const progress = 0.5;
		const refreshedDestinationBounds = createBounds(80, 360, 240, 320);

		refreshDestination({
			tag: "card",
			destinationScreenKey: "destination",
			destinationBounds: refreshedDestinationBounds,
		});

		const focusedStyles = buildRevealStyles({
			tag: "card",
			props: createFocusedProps(progress),
		});
		const unfocusedStyles = buildRevealStyles({
			tag: "card",
			props: createUnfocusedProps(progress),
		});
		const focusedRect = resolveFocusedDestinationRect(
			focusedStyles,
			refreshedDestinationBounds,
		);
		const unfocusedRect = resolveUnfocusedSourceRect(unfocusedStyles);

		expect(unfocusedRect.centerX).toBeCloseTo(focusedRect.centerX);
		expect(unfocusedRect.centerY).toBeCloseTo(focusedRect.centerY);
		expect(unfocusedRect.width).toBeCloseTo(focusedRect.width);
		expect(unfocusedRect.height).toBeCloseTo(focusedRect.height);
	});
});
