import { beforeEach, describe, expect, it } from "bun:test";
import {
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
	createScreenTransitionState,
} from "../constants";
import type { ScreenInterpolationProps } from "../types/animation.types";
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

const makeProps = (): Omit<ScreenInterpolationProps, "bounds"> => {
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

const makeClosingProps = (): Omit<ScreenInterpolationProps, "bounds"> => {
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
		expect(styles.card?.style?.opacity).toBe(1);
		expect(styles.card?.style?.zIndex).toBe(999);
		expect(styles.card?.style?.transform).toEqual([
			{ translateX: 0 },
			{ translateY: 0 },
		]);
		expect(styles[NAVIGATION_MASK_ELEMENT_STYLE_ID]?.style?.width).toBe(
			screenLayout.width,
		);
	});

	it("uses the initial destination link while closing", () => {
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
