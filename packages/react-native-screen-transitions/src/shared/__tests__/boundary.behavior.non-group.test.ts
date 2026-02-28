import { beforeEach, describe, expect, it } from "bun:test";
import { BoundStore } from "../stores/bounds";
import {
	createBounds,
	expectResolvedPair,
	makeContext,
	makeTag,
	registerSourceAndDestination,
} from "./helpers/bounds-behavior-fixtures";

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("Non-Group Flow", () => {
	it("uses id-only tag matching across source and destination", () => {
		const tag = makeTag("photo-card");

		registerSourceAndDestination({
			tag,
			sourceScreenKey: "screen-list",
			destinationScreenKey: "screen-detail",
		});

		const destinationLink = BoundStore.getActiveLink(tag, "screen-detail");
		expect(destinationLink?.source.screenKey).toBe("screen-list");
		expect(destinationLink?.destination?.screenKey).toBe("screen-detail");
	});

	it("supports simple push/pop flow from source capture to reverse lookup", () => {
		const tag = makeTag("hero-image");

		registerSourceAndDestination({
			tag,
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
		});

		const openingLookup = BoundStore.getActiveLink(tag, "screen-b");
		const closingLookup = BoundStore.getActiveLink(tag, "screen-a");

		expect(openingLookup?.source.screenKey).toBe("screen-a");
		expect(openingLookup?.destination?.screenKey).toBe("screen-b");
		expect(closingLookup?.source.screenKey).toBe("screen-a");
		expect(closingLookup?.destination?.screenKey).toBe("screen-b");
	});

	it("supports rapid retarget flow A->B->C with correct latest-link resolution", () => {
		const tag = makeTag("card");

		registerSourceAndDestination({
			tag,
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
			sourceBounds: createBounds(0, 0, 100, 100),
			destinationBounds: createBounds(200, 200, 160, 160),
		});
		registerSourceAndDestination({
			tag,
			sourceScreenKey: "screen-b",
			destinationScreenKey: "screen-c",
			sourceBounds: createBounds(20, 30, 120, 120),
			destinationBounds: createBounds(300, 320, 180, 180),
		});

		const latest = BoundStore.getActiveLink(tag, "screen-c");
		const screenBLookup = BoundStore.getActiveLink(tag, "screen-b");
		const prior = BoundStore.getActiveLink(tag, "screen-a");

		expect(latest?.source.screenKey).toBe("screen-b");
		expect(latest?.destination?.screenKey).toBe("screen-c");
		expect(screenBLookup?.source.screenKey).toBe("screen-b");
		expect(screenBLookup?.destination?.screenKey).toBe("screen-c");
		expect(prior?.source.screenKey).toBe("screen-a");
		expect(prior?.destination?.screenKey).toBe("screen-b");
	});

	it("supports ancestor screen-key matching for non-group tags", () => {
		const tag = makeTag("poster");

		registerSourceAndDestination({
			tag,
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-detail",
			sourceAncestorKeys: ["stack-a"],
		});

		expect(BoundStore.hasSourceLink(tag, "stack-a")).toBe(true);
		expect(BoundStore.getActiveLink(tag, "stack-a")?.source.screenKey).toBe(
			"screen-a",
		);
	});

	it("keeps unrelated tags isolated during clear operations", () => {
		const firstTag = makeTag("first-card");
		const secondTag = makeTag("second-card");

		registerSourceAndDestination({
			tag: firstTag,
			sourceScreenKey: "screen-a",
			destinationScreenKey: "detail-a",
		});
		registerSourceAndDestination({
			tag: secondTag,
			sourceScreenKey: "screen-b",
			destinationScreenKey: "detail-b",
		});

		BoundStore.clear("screen-a");

		expect(BoundStore.getActiveLink(firstTag, "detail-a")).toBeNull();
		expect(BoundStore.getActiveLink(secondTag, "detail-b")).not.toBeNull();
	});

	it("retains style snapshot metadata alongside bounds for matched tags", () => {
		const tag = makeTag("styled-card");
		const bounds = createBounds(5, 10, 80, 90);
		const styles = { opacity: 0.5, zIndex: 2 };

		BoundStore.registerSnapshot(tag, "screen-a", bounds, styles);

		const snapshot = BoundStore.getSnapshot(tag, "screen-a");
		expect(snapshot?.bounds).toEqual(bounds);
		expect(snapshot?.styles).toEqual(styles);
	});

	it("keeps non-group matching unaffected by group active-id state", () => {
		const nonGroupTag = makeTag("avatar");
		BoundStore.setGroupActiveId("photos", "99");

		registerSourceAndDestination({
			tag: nonGroupTag,
			sourceScreenKey: "screen-list",
			destinationScreenKey: "screen-detail",
		});

		const pair = BoundStore.resolveTransitionPair(
			nonGroupTag,
			makeContext({
				entering: true,
				previousScreenKey: "screen-list",
				currentScreenKey: "screen-detail",
			}),
		);

		expectResolvedPair(pair, {
			sourceScreenKey: "screen-list",
			destinationScreenKey: "screen-detail",
		});
	});
});
