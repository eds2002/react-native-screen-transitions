import { beforeEach, describe, expect, it } from "bun:test";
import { BoundStore } from "../stores/bounds.store";
import { createBounds } from "../utils/bounds";

const createMeasured = (
	x = 0,
	y = 0,
	width = 100,
	height = 100,
) => ({
	x,
	y,
	pageX: x,
	pageY: y,
	width,
	height,
});

const createAccessor = (currentKey = "screen-b") => {
	return createBounds({
		previous: undefined,
		current: { route: { key: currentKey } } as any,
		next: undefined,
		layouts: { screen: { width: 400, height: 800 } },
		insets: { top: 0, right: 0, bottom: 0, left: 0 },
		focused: true,
		progress: 0.5,
		stackProgress: 1,
		snapIndex: -1,
		active: { route: { key: currentKey } } as any,
		inactive: undefined,
		isActiveTransitioning: false,
		isDismissing: false,
	} as any);
};

const registerBasicLink = (tag = "card") => {
	BoundStore.setLinkSource(tag, "screen-a", createMeasured(0, 0, 100, 100));
	BoundStore.setLinkDestination(tag, "screen-b", createMeasured(100, 100, 220, 220));
};

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("createBounds accessor", () => {
	it("match(...).style() matches legacy bounds({...}) output", () => {
		registerBasicLink();

		const bounds = createAccessor();
		const legacy = bounds({ id: "card", method: "transform", space: "relative" });
		const chained = bounds
			.match({ id: "card" })
			.style({ method: "transform", space: "relative" });

		expect(chained).toEqual(legacy);
	});

	it("legacy bounds({...}) uses boundary defaults and allows per-call override", () => {
		registerBasicLink();
		BoundStore.registerBoundaryPresence("card", "screen-b", undefined, {
			method: "size",
			space: "absolute",
		});

		const bounds = createAccessor();

		const fromBoundaryDefaults = bounds({ id: "card" }) as any;
		expect(fromBoundaryDefaults.width).toBeDefined();
		expect(fromBoundaryDefaults.height).toBeDefined();

		const overridden = bounds({ id: "card", method: "transform" }) as any;
		expect(overridden.width).toBeUndefined();
		expect(overridden.height).toBeUndefined();
	});

	it("match(...).style() uses boundary defaults and allows per-call override", () => {
		registerBasicLink();
		BoundStore.registerBoundaryPresence("card", "screen-b", undefined, {
			method: "size",
			space: "absolute",
		});

		const bounds = createAccessor();

		const fromBoundaryDefaults = bounds.match({ id: "card" }).style() as any;
		expect(fromBoundaryDefaults.width).toBeDefined();
		expect(fromBoundaryDefaults.height).toBeDefined();

		const overridden = bounds
			.match({ id: "card" })
			.style({ method: "transform" }) as any;
		expect(overridden.width).toBeUndefined();
		expect(overridden.height).toBeUndefined();
	});

	it("match(...).style() updates group active id", () => {
		const bounds = createAccessor();

		bounds.match({ id: "42", group: "feed" }).style();

		expect(BoundStore.getGroupActiveId("feed")).toBe("42");
	});
});
