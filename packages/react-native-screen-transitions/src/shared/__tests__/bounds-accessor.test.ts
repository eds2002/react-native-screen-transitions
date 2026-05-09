import { beforeEach, describe, expect, it } from "bun:test";
import { createScreenTransitionState } from "../constants";
import type { BoundsInterpolationProps } from "../types/bounds.types";
import type { Layout } from "../types/screen.types";
import { createBoundsAccessor } from "../utils/bounds";
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
		navigationMaskEnabled: false,
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
});
