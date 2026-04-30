import { beforeEach, describe, expect, it } from "bun:test";
import {
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
	createScreenTransitionState,
} from "../constants";
import type { ScreenInterpolationProps } from "../types/animation.types";
import type { Layout } from "../types/screen.types";
import { buildZoomStyles } from "../utils/bounds/zoom/build";
import {
	createBounds,
	registerSourceAndDestination,
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

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("navigation zoom", () => {
	it("keeps presenting the last measured group member until the requested member has source bounds", () => {
		registerSourceAndDestination({
			tag: "gallery:a",
			sourceScreenKey: "list",
			destinationScreenKey: "detail",
			sourceBounds: createBounds(20, 30, 120, 160),
			destinationBounds: createBounds(0, 0, 400, 800),
		});

		const props = makeProps();

		buildZoomStyles({
			tag: "gallery:a",
			props,
			zoomOptions: { target: "bound" },
		});

		const retargetedStyles = buildZoomStyles({
			tag: "gallery:b",
			props,
			zoomOptions: { target: "bound" },
		});

		expect(retargetedStyles["gallery:a"]?.style?.opacity).toBe(1);
		expect(retargetedStyles["gallery:b"]).toBeUndefined();
		expect(
			retargetedStyles[NAVIGATION_MASK_ELEMENT_STYLE_ID]?.style?.width,
		).toBe(screenLayout.width);
	});
});
