import { beforeEach, describe, expect, it } from "bun:test";
import { applyMeasuredBoundsWrites } from "../../providers/helpers/measured-bounds-writes";
import { resolvePortalOffsetStyle } from "../../components/boundary/portal/components/boundary-portal/helpers/offset-style";
import { setPortalHostBounds } from "../../components/boundary/portal/components/boundary-portal/stores/host-bounds.store";
import { BoundStore, type Snapshot } from "../../stores/bounds";
import {
	createPendingPairKey,
	createScreenPairKey,
} from "../../stores/bounds/helpers/link-pairs.helpers";
import { pairs } from "../../stores/bounds/internals/state";
import { getMatchingSourceScreenKey } from "../../stores/bounds/internals/entries";
import {
	getPairKeyForSource,
	requestSourceMeasure,
} from "../../stores/bounds/internals/links";
import { createBoundsAccessor } from "../../utils/bounds";
import { computeBoundStyles } from "../../utils/bounds/helpers/styles/compute";
import type { EntryPatch } from "../../stores/bounds/types";

const createBounds = (
	x = 0,
	y = 0,
	width = 100,
	height = 100,
): Snapshot["bounds"] => ({
	x,
	y,
	pageX: x,
	pageY: y,
	width,
	height,
});

const createScrollLayout = (x = 0, y = 0) => ({
	vertical: { offset: y, contentSize: 1000, layoutSize: 400 },
	horizontal: { offset: x, contentSize: 1000, layoutSize: 400 },
	isTouched: false,
});

const createSharedValue = (initial: number) => ({
	_isReanimatedSharedValue: true,
	value: initial,
	get() {
		return this.value;
	},
});

const registerMeasuredEntry = (
	tag: string,
	screenKey: string,
	bounds: Snapshot["bounds"],
	styles: Snapshot["styles"] = {},
) => {
	BoundStore.entry.set(tag, screenKey, {
		bounds,
		styles,
	});
};

const registerBoundaryPresence = (
	tag: string,
	screenKey: string,
	boundaryConfig?: NonNullable<EntryPatch["boundaryConfig"]>,
	runtimeFlags?: Pick<EntryPatch, "handoff" | "escapeClipping">,
) => {
	BoundStore.entry.set(tag, screenKey, {
		boundaryConfig,
		...runtimeFlags,
	});
};

const hasBoundaryPresence = (tag: string, screenKey: string) => {
	return BoundStore.entry.get(tag, screenKey) !== null;
};

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("BoundStore.entry", () => {
	it("prefers the direct outgoing screen over retained matching boundaries", () => {
		registerBoundaryPresence("card", "screen-a");
		registerBoundaryPresence("card", "screen-b");
		registerBoundaryPresence("card", "screen-c");

		expect(
			getMatchingSourceScreenKey("card", "screen-c", "screen-b"),
		).toBe("screen-b");
	});

	it("writes and updates measured entries by direct screen key", () => {
		const first = createBounds(10, 20, 200, 300);
		const second = createBounds(15, 25, 220, 320);

		registerMeasuredEntry("card", "screen-a", first, { opacity: 0.8 });
		registerMeasuredEntry("card", "screen-a", second);

		const snapshot = BoundStore.entry.get("card", "screen-a");
		expect(snapshot?.bounds).toEqual(second);
		expect(BoundStore.entry.get("card", "stack-a")).toBeNull();
	});

	it("tracks boundary presence and removes empty entries", () => {
		registerBoundaryPresence("card", "screen-a", { method: "size" });

		expect(hasBoundaryPresence("card", "screen-a")).toBe(true);
		expect(BoundStore.entry.get("card", "screen-a")?.boundaryConfig).toEqual({
			method: "size",
		});

		BoundStore.entry.remove("card", "screen-a");

		expect(hasBoundaryPresence("card", "screen-a")).toBe(false);
	});

	it("tracks and clears portal runtime flags on boundary presence entries", () => {
		registerBoundaryPresence(
			"card",
			"screen-a",
			{ method: "size" },
			{ handoff: true, escapeClipping: true },
		);

		expect(BoundStore.entry.get("card", "screen-a")?.handoff).toBe(true);
		expect(BoundStore.entry.get("card", "screen-a")?.escapeClipping).toBe(
			true,
		);

		BoundStore.entry.set("card", "screen-a", {
			handoff: null,
			escapeClipping: null,
		});

		expect(BoundStore.entry.get("card", "screen-a")?.handoff).toBeUndefined();
		expect(
			BoundStore.entry.get("card", "screen-a")?.escapeClipping,
		).toBeUndefined();
	});
});

describe("applyMeasuredBoundsWrites", () => {
	it("always writes measured bounds to the entry registry", () => {
		const bounds = createBounds(10, 20, 120, 140);

		registerBoundaryPresence("card", "screen-a");

		applyMeasuredBoundsWrites({
			entryTag: "card",
			linkId: "card",
			currentScreenKey: "screen-a",
			measured: bounds,
			preparedStyles: { borderRadius: 12 },
		});

		const snapshot = BoundStore.entry.get("card", "screen-a");
		expect(snapshot?.bounds).toEqual(bounds);
		expect(snapshot?.styles).toEqual({});
	});

	it("writes source and destination through explicit pair keys", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const source = createBounds(25, 35, 150, 160);
		const destination = createBounds(200, 220, 180, 190);

		applyMeasuredBoundsWrites({
			entryTag: "card",
			linkId: "card",
			currentScreenKey: "screen-a",
			measured: source,
			preparedStyles: { borderRadius: 16 },
			handoff: true,
			linkWrite: {
				type: "source",
				pairKey,
			},
		});
		applyMeasuredBoundsWrites({
			entryTag: "card",
			linkId: "card",
			currentScreenKey: "screen-b",
			measured: destination,
			preparedStyles: { borderRadius: 20 },
			handoff: true,
			linkWrite: {
				type: "destination",
				pairKey,
			},
		});

		const link = BoundStore.link.getLink(pairKey, "card");
		expect(link?.source.bounds).toEqual(source);
		expect(link?.source.styles).toEqual({ borderRadius: 16 });
		expect(link?.source.handoff).toBe(true);
		expect(link?.destination?.bounds).toEqual(destination);
		expect(link?.destination?.styles).toEqual({ borderRadius: 20 });
		expect(link?.destination?.handoff).toBe(true);
	});

	it("snapshots shared style values when links are measured", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const scale = createSharedValue(0.58);

		applyMeasuredBoundsWrites({
			entryTag: "card",
			linkId: "card",
			currentScreenKey: "screen-a",
			measured: createBounds(25, 35, 150, 160),
			preparedStyles: { transform: [{ scale }] },
			linkWrite: {
				type: "source",
				pairKey,
			},
		});

		scale.value = 1.1;

		const link = BoundStore.link.getLink(pairKey, "card");
		expect(link?.source.styles).toEqual({ transform: [{ scale: 0.58 }] });
	});

	it("preserves transform arrays without snapshotting object-valued style metadata", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const matrix = [1, 0, 0, 1, 24, 32];

		applyMeasuredBoundsWrites({
			entryTag: "card",
			linkId: "card",
			currentScreenKey: "screen-a",
			measured: createBounds(25, 35, 150, 160),
			preparedStyles: {
				shadowOffset: { width: 2, height: 3 },
				transform: [{ matrix }],
			},
			linkWrite: {
				type: "source",
				pairKey,
			},
		});

		const link = BoundStore.link.getLink(pairKey, "card");
		expect(link?.source.styles).toEqual({
			transform: [{ matrix }],
		});
	});
});

describe("BoundStore.link pair writes", () => {
	it("finds a source pair requested before its destination measures", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		requestSourceMeasure(pairKey, "card");

		expect(getPairKeyForSource("card", "screen-a")).toBe(pairKey);
	});

	it("sets a source by pair key and id", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const bounds = createBounds();

		BoundStore.link.setSource(pairKey, "card", "screen-a", bounds);

		expect(BoundStore.link.getSource(pairKey, "card")?.bounds).toEqual(bounds);
		expect(BoundStore.link.getDestination(pairKey, "card")).toBeNull();
	});

	it("sets a destination before the source exists", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const destination = createBounds(200, 200);

		BoundStore.link.setDestination(
			pairKey,
			"card",
			"screen-b",
			destination,
		);

		const link = BoundStore.link.getLink(pairKey, "card");
		expect(link?.source).toBeNull();
		expect(link?.destination?.bounds).toEqual(destination);
	});

	it("keeps pending source pairs isolated when destination attaches", () => {
		const pendingPairKey = createPendingPairKey("screen-a");
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const source = createBounds(10, 20);
		const destination = createBounds(200, 220);

		BoundStore.link.setSource(pendingPairKey, "card", "screen-a", source);
		BoundStore.link.setDestination(pairKey, "card", "screen-b", destination);

		const link = BoundStore.link.getLink(pairKey, "card");
		expect(link?.source).toBeNull();
		expect(link?.destination?.bounds).toEqual(destination);
		expect(BoundStore.link.getSource(pendingPairKey, "card")?.bounds).toEqual(
			source,
		);
	});

	it("tracks link status in the stored tag link", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const source = createBounds(10, 20);
		const destination = createBounds(200, 220);

		expect(BoundStore.link.getLink(pairKey, "card")).toBeNull();

		BoundStore.link.setDestination(pairKey, "card", "screen-b", destination);
		expect(BoundStore.link.getLink(pairKey, "card")).toEqual({
			status: "source-incomplete",
			source: null,
			destination: {
				screenKey: "screen-b",
				bounds: destination,
				styles: {},
			},
			initialDestination: {
				screenKey: "screen-b",
				bounds: destination,
				styles: {},
			},
		});

		BoundStore.link.setSource(pairKey, "card", "screen-a", source);
		expect(BoundStore.link.getLink(pairKey, "card")).toEqual({
			status: "complete",
			source: {
				screenKey: "screen-a",
				bounds: source,
				styles: {},
			},
			destination: {
				screenKey: "screen-b",
				bounds: destination,
				styles: {},
			},
			initialSource: {
				screenKey: "screen-a",
				bounds: source,
				styles: {},
			},
			initialDestination: {
				screenKey: "screen-b",
				bounds: destination,
				styles: {},
			},
		});
	});

	it("sets and updates destination while preserving the initial destination", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const firstDestination = createBounds(100, 100);
		const secondDestination = createBounds(150, 160);

		BoundStore.link.setSource(pairKey, "card", "screen-a", createBounds());
		BoundStore.link.setDestination(
			pairKey,
			"card",
			"screen-b",
			firstDestination,
		);
		BoundStore.link.setDestination(
			pairKey,
			"card",
			"screen-b",
			secondDestination,
		);

		const link = BoundStore.link.getLink(pairKey, "card");
		expect(link?.destination?.bounds).toEqual(secondDestination);
		expect(link?.initialDestination?.bounds).toEqual(firstDestination);
	});

	it("stores multiple ids inside one screen pair", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		BoundStore.link.setSource(pairKey, "card", "screen-a", createBounds());
		BoundStore.link.setSource(pairKey, "title", "screen-a", createBounds(10, 10));
		BoundStore.link.setDestination(pairKey, "card", "screen-b", createBounds());
		BoundStore.link.setDestination(
			pairKey,
			"title",
			"screen-b",
			createBounds(20, 20),
		);

		expect(Object.keys(pairs.get()[pairKey].links).sort()).toEqual([
			"card",
			"title",
		]);
	});

	it("stores optional group state inside the screen pair without replacing ids", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		BoundStore.link.setSource(
			pairKey,
			"1",
			"screen-a",
			createBounds(10, 10),
			{},
			"colors",
		);
		BoundStore.link.setDestination(
			pairKey,
			"1",
			"screen-b",
			createBounds(20, 20),
			{},
			"colors",
		);
		BoundStore.link.setActiveGroupId(pairKey, "colors", "3");

		expect(Object.keys(pairs.get()[pairKey].links)).toEqual(["1"]);
		expect(pairs.get()[pairKey].links["1"].group).toBe("colors");
		expect(pairs.get()[pairKey].groups.colors.activeId).toBe("3");
		expect(pairs.get()[pairKey].groups.colors.initialId).toBe("1");
		expect(BoundStore.link.getActiveGroupId(pairKey, "colors")).toBe("3");
	});

	it("sets pair-local group initial id from destination writes", () => {
		const pendingPairKey = createPendingPairKey("screen-a");
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		BoundStore.link.setSource(
			pendingPairKey,
			"1",
			"screen-a",
			createBounds(10, 10),
			{},
			"colors",
		);
		BoundStore.link.setDestination(
			pairKey,
			"1",
			"screen-b",
			createBounds(20, 20),
			{},
			"colors",
		);

		expect(pairs.get()[pairKey].groups.colors.initialId).toBe("1");
		expect(BoundStore.link.getActiveGroupId(pairKey, "colors")).toBe("1");
		expect(BoundStore.link.getSource(pendingPairKey, "1")?.bounds).toEqual(
			createBounds(10, 10),
		);
	});

	it("parses concrete group tags to the member id for link access", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const source = createBounds(10, 10);

		BoundStore.link.setSource(
			pairKey,
			"colors:1",
			"screen-a",
			source,
			{},
			"colors",
		);

		expect(BoundStore.link.getSource(pairKey, "1")?.bounds).toEqual(source);
		expect(Object.keys(pairs.get()[pairKey].links)).toEqual(["1"]);
	});

	it("keeps pending source pairs isolated when the full pair source is written", () => {
		const pendingPairKey = createPendingPairKey("screen-a");
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		BoundStore.link.setSource(
			pendingPairKey,
			"card",
			"screen-a",
			createBounds(1, 1),
		);
		BoundStore.link.setSource(pairKey, "card", "screen-a", createBounds(2, 2));

		expect(BoundStore.link.getSource(pendingPairKey, "card")?.bounds.pageX).toBe(
			1,
		);
		expect(BoundStore.link.getSource(pairKey, "card")?.bounds.pageX).toBe(2);
	});
});

describe("BoundStore.link.getPair", () => {
	it("resolves a nested source for a root destination", () => {
		const pairKey = createScreenPairKey("tray-a", "palette");
		const source = createBounds(10, 20);
		const destination = createBounds(100, 120);

		BoundStore.entry.set("colors:ember", "tray-a", {});
		BoundStore.entry.set("colors:ember", "palette", {});
		BoundStore.link.setSource(
			pairKey,
			"ember",
			"tray-a",
			source,
			{},
			"colors",
		);
		BoundStore.link.setDestination(
			pairKey,
			"ember",
			"palette",
			destination,
			{},
			"colors",
		);

		expect(
			BoundStore.link.getPair("colors:ember", {
				entering: true,
				previousScreenKey: "tray",
				currentScreenKey: "palette",
			}),
		).toMatchObject({
			sourceBounds: source,
			destinationBounds: destination,
			sourceScreenKey: "tray-a",
			destinationScreenKey: "palette",
		});
	});

	it("resolves entering from previous/current screen pair", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const source = createBounds(10, 20);
		const destination = createBounds(100, 120);

		BoundStore.link.setSource(pairKey, "card", "screen-a", source);
		BoundStore.link.setDestination(pairKey, "card", "screen-b", destination);

		const resolved = BoundStore.link.getPair("card", {
			entering: true,
			previousScreenKey: "screen-a",
			currentScreenKey: "screen-b",
		});

		expect(resolved.sourceBounds).toEqual(source);
		expect(resolved.destinationBounds).toEqual(destination);
	});

	it("resolves exiting from current/next screen pair", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const source = createBounds(10, 20);
		const destination = createBounds(100, 120);

		BoundStore.link.setSource(pairKey, "card", "screen-a", source);
		BoundStore.link.setDestination(pairKey, "card", "screen-b", destination);

		const resolved = BoundStore.link.getPair("card", {
			entering: false,
			currentScreenKey: "screen-a",
			nextScreenKey: "screen-b",
		});

		expect(resolved.sourceBounds).toEqual(source);
		expect(resolved.destinationBounds).toEqual(destination);
	});

	it("falls back to pair-local initial group link when requested member is missing", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const source = createBounds(10, 20);
		const destination = createBounds(100, 120);

		BoundStore.link.setSource(pairKey, "1", "screen-a", source, {}, "colors");
		BoundStore.link.setDestination(
			pairKey,
			"1",
			"screen-b",
			destination,
			{},
			"colors",
		);
		BoundStore.link.setActiveGroupId(pairKey, "colors", "4");

		const resolved = BoundStore.link.getPair("colors:4", {
			entering: false,
			currentScreenKey: "screen-a",
			nextScreenKey: "screen-b",
		});

		expect(resolved.sourceBounds).toEqual(source);
		expect(resolved.destinationBounds).toEqual(destination);
	});

	it("falls back to initial group source while requested source is missing", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const source = createBounds(10, 20);

		BoundStore.link.setSource(pairKey, "1", "screen-a", source, {}, "colors");
		BoundStore.link.setActiveGroupId(pairKey, "colors", "1");
		BoundStore.link.setActiveGroupId(pairKey, "colors", "2");

		const resolved = BoundStore.link.getPair("colors:2", {
			entering: false,
			currentScreenKey: "screen-a",
			nextScreenKey: "screen-b",
		});

		expect(resolved.sourceBounds).toEqual(source);
		expect(resolved.destinationBounds).toBeNull();
	});

	it("does not fall back to pending initial group source while requested source is missing", () => {
		const pendingPairKey = createPendingPairKey("screen-a");
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const source = createBounds(10, 20);

		BoundStore.link.setSource(
			pendingPairKey,
			"1",
			"screen-a",
			source,
			{},
			"colors",
		);
		BoundStore.link.setActiveGroupId(pairKey, "colors", "1");
		BoundStore.link.setActiveGroupId(pairKey, "colors", "2");

		const resolved = BoundStore.link.getPair("colors:2", {
			entering: false,
			currentScreenKey: "screen-a",
			nextScreenKey: "screen-b",
		});

		expect(resolved.sourceBounds).toBeNull();
		expect(resolved.destinationBounds).toBeNull();
	});

	it("prefers requested group source over initial source when destination is absent", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const initialSource = createBounds(10, 20);
		const requestedSource = createBounds(80, 120);

		BoundStore.link.setSource(
			pairKey,
			"1",
			"screen-a",
			initialSource,
			{},
			"colors",
		);
		BoundStore.link.setActiveGroupId(pairKey, "colors", "1");
		BoundStore.link.setActiveGroupId(pairKey, "colors", "2");
		BoundStore.link.setSource(
			pairKey,
			"2",
			"screen-a",
			requestedSource,
			{},
			"colors",
		);

		const resolved = BoundStore.link.getPair("colors:2", {
			entering: false,
			currentScreenKey: "screen-a",
			nextScreenKey: "screen-b",
		});

		expect(resolved.sourceBounds).toEqual(requestedSource);
		expect(resolved.destinationBounds).toBeNull();
	});

	it("does not resolve entering from a pending source when destination is absent", () => {
		const pendingPairKey = createPendingPairKey("screen-a");
		const source = createBounds(10, 20);

		BoundStore.link.setSource(pendingPairKey, "card", "screen-a", source);

		const resolved = BoundStore.link.getPair("card", {
			entering: true,
			previousScreenKey: "screen-a",
			currentScreenKey: "screen-b",
		});

		expect(resolved.sourceBounds).toBeNull();
		expect(resolved.destinationBounds).toBeNull();
	});

	it("does not resolve exiting from a pending source when destination is absent", () => {
		const pendingPairKey = createPendingPairKey("screen-a");
		const source = createBounds(10, 20);

		BoundStore.link.setSource(pendingPairKey, "card", "screen-a", source);

		const resolved = BoundStore.link.getPair("card", {
			entering: false,
			currentScreenKey: "screen-a",
			nextScreenKey: "screen-b",
		});

		expect(resolved.sourceBounds).toBeNull();
		expect(resolved.destinationBounds).toBeNull();
	});
});

describe("BoundsAccessor", () => {
	it("syncs grouped active id when creating a scoped accessor", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const bounds = createBoundsAccessor(
			() =>
				({
					previous: { route: { key: "screen-a" } },
					current: { route: { key: "screen-b" } },
				}) as any,
		);

		bounds({ id: "2", group: "colors" });

		expect(BoundStore.link.getActiveGroupId(pairKey, "colors")).toBe("2");
	});

	it("can resolve portal host offsets without scroll compensation", () => {
		setPortalHostBounds("screen-a", {
			...createBounds(4, -102, 370, 0),
			scroll: createScrollLayout(5, 100),
		});

		expect(
			resolvePortalOffsetStyle({
				hostKey: "screen-a",
				placement: "cross-screen",
				bounds: {
					...createBounds(40, 220, 100, 80),
					scroll: createScrollLayout(20, 150),
				} as any,
			}),
		).toEqual({
			transform: [{ translateY: 322 }, { translateX: 36 }],
		});
	});

	it("does not compensate portal host offsets from destination live scroll", () => {
		setPortalHostBounds("screen-b-host", {
			...createBounds(4, -102, 370, 0),
			scroll: createScrollLayout(5, 100),
		});

		expect(
			resolvePortalOffsetStyle({
				hostKey: "screen-b-host",
				placement: "cross-screen",
				bounds: createBounds(40, 220, 100, 80),
			}),
		).toEqual({
			transform: [{ translateY: 322 }, { translateX: 36 }],
		});
	});
});

describe("boundary runtime source links", () => {
	it("stores handoff and escape flags on source links", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		BoundStore.link.setSource(
			pairKey,
			"card",
			"screen-a",
			createBounds(0, 0),
			{},
			undefined,
			{ handoff: true, escapeClipping: true },
		);

		expect(BoundStore.link.getSource(pairKey, "card")?.handoff).toBe(true);
		expect(BoundStore.link.getSource(pairKey, "card")?.escapeClipping).toBe(
			true,
		);
	});

	it("does not preserve runtime flags when a source refresh omits them", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		BoundStore.link.setSource(
			pairKey,
			"card",
			"screen-a",
			createBounds(0, 0),
			{},
			undefined,
			{ handoff: true, escapeClipping: true },
		);
		BoundStore.link.setSource(pairKey, "card", "screen-a", createBounds(0, 4));

		expect(BoundStore.link.getSource(pairKey, "card")?.handoff).toBeUndefined();
		expect(
			BoundStore.link.getSource(pairKey, "card")?.escapeClipping,
		).toBeUndefined();
	});

	it("does not shift source paths by destination scroll", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const destination = {
			...createBounds(120, 300, 200, 150),
			scroll: createScrollLayout(0, 100),
		} as Snapshot["bounds"];

		const registerLink = (tag: string, sourceY: number) => {
			BoundStore.link.setSource(
				pairKey,
				tag,
				"screen-a",
				createBounds(0, sourceY, 100, 80),
			);
			BoundStore.link.setDestination(pairKey, tag, "screen-b", destination);
		};

		registerLink("classic", 40);
		registerLink("escaped", 40);

		const computeFor = (tag: string) =>
			computeBoundStyles(
				{
					id: tag,
					current: { route: { key: "screen-a" } },
					next: {
						route: { key: "screen-b" },
						layouts: { scroll: createScrollLayout(0, 1000) },
					},
					progress: 1.4,
					dimensions: { width: 400, height: 800 },
				} as any,
				{ id: tag },
			);

		const classic = computeFor("classic");
		const escaped = computeFor("escaped");

		expect(escaped).toEqual(classic);
	});
});

describe("BoundStore.cleanup.byScreen", () => {
	it("clears entries and links for a direct screen key", () => {
		const removedPairKey = createScreenPairKey("screen-a", "screen-b");
		const keptPairKey = createScreenPairKey("screen-c", "screen-d");

		registerMeasuredEntry("card", "screen-a", createBounds());
		registerMeasuredEntry("card", "screen-c", createBounds());
		BoundStore.link.setSource(removedPairKey, "card", "screen-a", createBounds());
		BoundStore.link.setDestination(
			removedPairKey,
			"card",
			"screen-b",
			createBounds(),
		);
		BoundStore.link.setSource(keptPairKey, "card", "screen-c", createBounds());

		BoundStore.cleanup.byScreen("screen-a");

		expect(BoundStore.entry.get("card", "screen-a")).toBeNull();
		expect(BoundStore.entry.get("card", "screen-c")).not.toBeNull();
		expect(BoundStore.link.getLink(removedPairKey, "card")).toBeNull();
		expect(BoundStore.link.getLink(keptPairKey, "card")).not.toBeNull();
	});

	it("removes the whole screen pair when either side unmounts", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		BoundStore.link.setSource(pairKey, "card", "screen-a", createBounds());
		BoundStore.link.setDestination(pairKey, "card", "screen-b", createBounds());
		BoundStore.link.setSource(pairKey, "title", "screen-a", createBounds());
		BoundStore.link.setDestination(pairKey, "title", "screen-b", createBounds());

		BoundStore.cleanup.byScreen("screen-b");

		expect(pairs.get()[pairKey]).toBeUndefined();
	});
});
