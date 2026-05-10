import { beforeEach, describe, expect, it } from "bun:test";
import { createScreenTransitionState } from "../constants";
import { BoundStore } from "../stores/bounds";
import type { BoundsInterpolationProps } from "../types/bounds.types";
import type { Layout } from "../types/screen.types";
import { createBoundsAccessor } from "../utils/bounds";
import {
	createBounds,
	registerMeasuredEntry,
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

	it("resolves grouped links from the requested id before active metadata", () => {
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

		BoundStore.group.setActiveId("photos", "1");
		const initial = bounds.getLink("photos:1");

		expect(initial?.id).toBe("photos:1");

		BoundStore.group.setActiveId("photos", "2");
		expect(bounds.getLink("photos:1")?.id).toBe("photos:1");

		const active = bounds.getLink("photos:missing");
		const raw = active?.compute({
			method: "size",
			space: "absolute",
			target: "fullscreen",
			raw: true,
		});

		expect(active?.id).toBe("photos:2");
		expect(raw?.width).toBe(120);
		expect(raw?.height).toBe(220);
	});

	it("keeps initial link sides on refreshed links", () => {
		registerSourceAndDestination({
			tag: "card",
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(10, 20, 100, 200),
			destinationBounds: createBounds(50, 100, 200, 400),
		});
		refreshDestination({
			tag: "card",
			destinationScreenKey: "screen-b",
			destinationBounds: createBounds(70, 120, 200, 400),
		});
		BoundStore.link.setSource(
			"refresh",
			"card",
			"screen-a",
			createBounds(30, 40, 110, 210),
		);

		const bounds = createBoundsAccessor(makeProps);
		const link = bounds.getLink("card");

		expect(link?.source?.bounds.pageX).toBe(30);
		expect(link?.initialSource?.bounds.pageX).toBe(10);
		expect(link?.destination?.bounds.pageX).toBe(70);
		expect(link?.initialDestination?.bounds.pageX).toBe(50);
	});

	it("exposes group active and initial ids from either group names or tags", () => {
		BoundStore.group.setInitialId("photos", "1");
		BoundStore.group.setActiveId("photos", "2");

		expect(BoundStore.group.getInitialId("photos")).toBe("1");
		expect(BoundStore.group.getInitialId("photos:anything")).toBe("1");
		expect(BoundStore.group.getActiveId("photos")).toBe("2");
		expect(BoundStore.group.getActiveId("photos:anything")).toBe("2");
	});

	it("does not make a stray active id become the initial group id", () => {
		BoundStore.group.setActiveId("photos", "2");

		expect(BoundStore.group.getActiveId("photos")).toBe("2");
		expect(BoundStore.group.getInitialId("photos")).toBeNull();
	});

	it("falls back to the initial group member when requested and active links miss", () => {
		registerSourceAndDestination({
			tag: "photos:1",
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(10, 20, 100, 200),
			destinationBounds: createBounds(50, 100, 200, 400),
		});

		const bounds = createBoundsAccessor(makeProps);

		BoundStore.group.setInitialId("photos", "1");
		BoundStore.group.setActiveId("photos", "2");

		const fallback = bounds.getLink("photos:missing");

		expect(fallback?.id).toBe("photos:1");
		expect(fallback?.source?.bounds.width).toBe(100);
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
		refreshDestination({
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
