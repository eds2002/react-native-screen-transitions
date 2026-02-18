import { beforeEach, describe, expect, it } from "bun:test";
import {
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_HOST_FLAG_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
} from "../constants";
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

const createAccessor = (
	currentKey = "screen-b",
	focused = true,
	progress = 0.5,
) => {
	return createBounds({
		previous: undefined,
		current: { route: { key: currentKey } } as any,
		next: undefined,
		layouts: { screen: { width: 400, height: 800 } },
		insets: { top: 0, right: 0, bottom: 0, left: 0 },
		focused,
		progress,
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

	it("match(...).navigation.hero() returns focused navigation styles and mask host flag", () => {
		registerBasicLink();
		const bounds = createAccessor("screen-b");

		const styles = bounds.match({ id: "card" }).navigation.hero();

		expect(styles[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]).toEqual({});
		expect(styles[NAVIGATION_CONTAINER_STYLE_ID]).toBeDefined();
		expect(styles[NAVIGATION_MASK_STYLE_ID]).toBeDefined();
		expect(styles.card).toBeUndefined();
	});

	it("match(...).navigation.hero() returns unfocused shared-element style", () => {
		registerBasicLink();
		const bounds = createAccessor("screen-a", false);

		const styles = bounds.match({ id: "card" }).navigation.hero();

		expect(styles[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]).toBeUndefined();
		expect(styles.card).toBeDefined();
		expect(styles[NAVIGATION_CONTAINER_STYLE_ID]).toBeUndefined();
		expect(styles[NAVIGATION_MASK_STYLE_ID]).toBeUndefined();
	});

	it("match(...).navigation.zoom() defaults to top anchoring and allows overrides", () => {
		registerBasicLink();
		BoundStore.registerBoundaryPresence("card", "screen-b", undefined, {
			anchor: "bottom",
		});
		const bounds = createAccessor("screen-b");

		const inherited = bounds.match({ id: "card" }).navigation.zoom();
		const overridden = bounds
			.match({ id: "card" })
			.navigation.zoom({ anchor: "center" });

		expect(inherited[NAVIGATION_CONTAINER_STYLE_ID]).toBeDefined();
		expect(overridden[NAVIGATION_CONTAINER_STYLE_ID]).toBeDefined();
	});

	it("match(...).navigation.zoom() uses top anchor preset when no boundary defaults exist", () => {
		registerBasicLink();
		const bounds = createAccessor("screen-b");

		const presetDefault = bounds.match({ id: "card" }).navigation.zoom();
		const explicitTop = bounds
			.match({ id: "card" })
			.navigation.zoom({ anchor: "top" });

		expect(presetDefault[NAVIGATION_CONTAINER_STYLE_ID]).toEqual(
			explicitTop[NAVIGATION_CONTAINER_STYLE_ID],
		);
	});

	it("match(...).navigation.zoom() enables mask host only for focused screen", () => {
		registerBasicLink();
		const focusedBounds = createAccessor("screen-b", true);
		const unfocusedBounds = createAccessor("screen-a", false);

		const focusedStyles = focusedBounds.match({ id: "card" }).navigation.zoom();
		const unfocusedStyles = unfocusedBounds
			.match({ id: "card" })
			.navigation.zoom();
		const focusedContainer = focusedStyles[NAVIGATION_CONTAINER_STYLE_ID] as any;

		expect(focusedStyles[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]).toEqual({});
		expect(unfocusedStyles[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]).toBeUndefined();
		expect(focusedContainer.opacity).toBeDefined();
	});

	it("match(...).navigation.zoom() fades focused screen in quickly", () => {
		registerBasicLink();
		const earlyBounds = createAccessor("screen-b", true, 0.1);
		const thresholdBounds = createAccessor("screen-b", true, 0.325);

		const earlyStyles = earlyBounds.match({ id: "card" }).navigation.zoom();
		const thresholdStyles = thresholdBounds
			.match({ id: "card" })
			.navigation.zoom();

		const earlyOpacity = (earlyStyles[NAVIGATION_CONTAINER_STYLE_ID] as any)
			.opacity;
		const thresholdOpacity = (thresholdStyles[NAVIGATION_CONTAINER_STYLE_ID] as any)
			.opacity;

		expect(earlyOpacity).toBeGreaterThan(0);
		expect(earlyOpacity).toBeLessThan(1);
		expect(thresholdOpacity).toBe(1);
	});

	it("match(...).navigation.zoom() fades source element after focused fade completes", () => {
		registerBasicLink();
		const beforeFadeBounds = createAccessor("screen-a", false, 1.2);
		const duringFadeBounds = createAccessor("screen-a", false, 1.6);

		const beforeFadeStyles = beforeFadeBounds
			.match({ id: "card" })
			.navigation.zoom();
		const duringFadeStyles = duringFadeBounds
			.match({ id: "card" })
			.navigation.zoom();

		const beforeOpacity = (beforeFadeStyles.card as any).opacity;
		const duringOpacity = (duringFadeStyles.card as any).opacity;

		expect(beforeOpacity).toBe(1);
		expect(duringOpacity).toBeLessThan(1);
		expect(duringOpacity).toBeGreaterThan(0);
	});

	it("match(...).navigation.zoom() scales focused screen from source-width ratio", () => {
		registerBasicLink();
		const bounds = createAccessor("screen-b", true, 0);

		const styles = bounds.match({ id: "card" }).navigation.zoom();
		const containerStyle = styles[NAVIGATION_CONTAINER_STYLE_ID] as any;
		const scaleEntry = containerStyle?.transform?.find(
			(entry: Record<string, number>) => "scale" in entry,
		);

		expect(scaleEntry?.scale).toBe(0.25);
	});
});
