import { beforeEach, describe, expect, it } from "bun:test";
import { createScreenTransitionState } from "../../constants";
import type {
	ScreenInterpolationProps,
	ScreenTransitionOptions,
	ScreenTransitionState,
} from "../../types/animation.types";
import type { GestureValues } from "../../types/gesture.types";
import type { Layout } from "../../types/screen.types";
import { buildZoomStyles } from "../../utils/bounds/navigation/zoom/build";
import {
	createBounds,
	registerSourceAndDestination,
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

const centeredBounds = createBounds(150, 350, 100, 100);

const getTransformValue = (
	transform: Array<Record<string, number>>,
	key: string,
) => transform.find((entry) => key in entry)?.[key] ?? 0;

const resolveExpectedDismissScale = ({
	progress,
	releaseScale,
	rawDrag,
}: {
	progress: number;
	releaseScale: number;
	rawDrag: number;
}) => {
	const closeProgress = 1 - progress;
	const scaleProgress = Math.sin((Math.PI / 2) * closeProgress);
	const baseScale = releaseScale + (1 - releaseScale) * scaleProgress;
	const orbitScale =
		1 - 0.8 * rawDrag * Math.sin(Math.PI * closeProgress);

	return baseScale * orbitScale;
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
	logicallySettled = 0,
	gesture,
	options = {},
}: {
	key: string;
	progress: number;
	closing?: number;
	logicallySettled?: number;
	gesture?: Partial<GestureValues>;
	options?: ScreenTransitionOptions;
}): ScreenTransitionState => {
	const state = createScreenTransitionState(
		{ key } as any,
		undefined,
		false,
		options,
	);
	state.progress = progress;
	state.closing = closing;
	state.animating = logicallySettled ? 0 : 1;
	state.logicallySettled = logicallySettled;
	state.gesture = createGesture(gesture);
	state.layouts.screen = screenLayout;

	return state;
};

const createFocusedProps = (
	destinationProgress: number,
	gesture: Partial<GestureValues> = {},
	options: ScreenTransitionOptions = {},
): ScreenInterpolationProps => {
	const previous = createState({ key: "source", progress: 1 });
	const current = createState({
		key: "destination",
		progress: destinationProgress,
		closing: 1,
		options,
		gesture: {
			active: "vertical",
			direction: "vertical",
			normY: 0.5,
			y: 400,
			raw: {
				...createGesture().raw,
				normY: 0.5,
				y: 400,
			},
			...gesture,
		},
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
	gesture: Partial<GestureValues> = {},
	options: ScreenTransitionOptions = {},
): ScreenInterpolationProps => {
	const current = createState({ key: "source", progress: 1 });
	const next = createState({
		key: "destination",
		progress: destinationProgress,
		closing: 1,
		options,
		gesture: {
			active: "vertical",
			direction: "vertical",
			normY: 0.5,
			y: 400,
			raw: {
				...createGesture().raw,
				normY: 0.5,
				y: 400,
			},
			...gesture,
		},
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
		sourceBounds: centeredBounds,
		destinationBounds: centeredBounds,
	});
});

describe("navigation zoom close gesture handoff", () => {
	it("uses live focused gesture translation without extra zoom resistance", () => {
		const start = buildZoomStyles({
			tag: "card",
			zoomOptions: { target: "bound", debug: true },
			props: createFocusedProps(1),
		});
		const mid = buildZoomStyles({
			tag: "card",
			zoomOptions: { target: "bound", debug: true },
			props: createFocusedProps(0.5, {
				dismissing: 1,
				y: 480,
			}),
		});
		const end = buildZoomStyles({
			tag: "card",
			zoomOptions: { target: "bound", debug: true },
			props: createFocusedProps(0, {
				dismissing: 1,
				y: 0,
			}),
		});

		const startTransform = start.content?.style?.transform as Array<
			Record<string, number>
		>;
		const midTransform = mid.content?.style?.transform as Array<
			Record<string, number>
		>;
		const endTransform = end.content?.style?.transform as Array<
			Record<string, number>
		>;

		expect(getTransformValue(startTransform, "translateY")).toBeCloseTo(400);
		expect(getTransformValue(midTransform, "translateY")).toBeCloseTo(480);
		expect(getTransformValue(endTransform, "translateY")).toBeCloseTo(0);

		const releaseScale = 0.390625;
		const midDismissScale = resolveExpectedDismissScale({
			progress: 0.5,
			releaseScale,
			rawDrag: 0.5,
		});

		expect(getTransformValue(startTransform, "scale")).toBeCloseTo(0.390625);
		expect(getTransformValue(midTransform, "scale")).toBeCloseTo(
			midDismissScale,
		);
		expect(getTransformValue(endTransform, "scale")).toBeCloseTo(1);

		expect(start.options?.gestureProgressMode).toBe("freeform");
		expect(start.options?.gestureSensitivity).toBeCloseTo(0.4);
		expect(start.options?.gestureReleaseVelocityScale).toBeCloseTo(
			0.9096774194,
		);
	});

	it("uses live unfocused source gesture compensation during close", () => {
		const styles = buildZoomStyles({
			tag: "card",
			zoomOptions: { target: "bound", debug: true },
			props: createUnfocusedProps(0.5, {
				dismissing: 1,
				y: 480,
			}),
		});

		const sourceTransform = styles.card?.style?.transform as Array<
			Record<string, number>
		>;
		const dismissScale = resolveExpectedDismissScale({
			progress: 0.5,
			releaseScale: 0.390625,
			rawDrag: 0.5,
		});

		expect(getTransformValue(sourceTransform, "translateY")).toBeCloseTo(
			480 / 0.96875,
		);
		expect(getTransformValue(sourceTransform, "scaleY")).toBeCloseTo(
			dismissScale / 0.96875,
		);
		expect(styles.options?.gestureProgressMode).toBe("freeform");
	});

	it("prefers active screen gesture option overrides over zoom defaults", () => {
		const styles = buildZoomStyles({
			tag: "card",
			zoomOptions: { target: "bound", debug: true },
			props: createFocusedProps(
				1,
				{},
				{
					gestureReleaseVelocityScale: 1.6,
					gestureProgressMode: "freeform",
				},
			),
		});

		expect(styles.options?.gestureProgressMode).toBe("freeform");
		expect(styles.options?.gestureReleaseVelocityScale).toBe(1.6);
	});
});
