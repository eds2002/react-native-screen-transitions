import { beforeEach, describe, expect, it } from "bun:test";
import { BoundStore } from "../../stores/bounds";
import { createScreenPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";
import {
	createBounds,
	expectResolvedPair,
	makeContext,
	makeTag,
	registerMeasuredEntry,
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

		const pairKey = createScreenPairKey("screen-list", "screen-detail");
		const destinationLink = BoundStore.link.getLink(pairKey, tag);
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

		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const openingLookup = BoundStore.link.getLink(pairKey, tag);
		const closingLookup = BoundStore.link.getLink(pairKey, tag);

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

		const abPairKey = createScreenPairKey("screen-a", "screen-b");
		const bcPairKey = createScreenPairKey("screen-b", "screen-c");
		const latest = BoundStore.link.getLink(bcPairKey, tag);
		const screenBLookup = BoundStore.link.getLink(bcPairKey, tag);
		const prior = BoundStore.link.getLink(abPairKey, tag);

		expect(latest?.source.screenKey).toBe("screen-b");
		expect(latest?.destination?.screenKey).toBe("screen-c");
		expect(screenBLookup?.source.screenKey).toBe("screen-b");
		expect(screenBLookup?.destination?.screenKey).toBe("screen-c");
		expect(prior?.source.screenKey).toBe("screen-a");
		expect(prior?.destination?.screenKey).toBe("screen-b");
	});

	it("does not implicitly match ancestor screen keys for non-group tags", () => {
		const tag = makeTag("poster");

		registerSourceAndDestination({
			tag,
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-detail",
		});

		const ancestorPairKey = createScreenPairKey("stack-a", "screen-detail");
		expect(BoundStore.link.getSource(ancestorPairKey, tag)).toBeNull();
		expect(BoundStore.link.getLink(ancestorPairKey, tag)).toBeNull();
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

		BoundStore.cleanup.byScreen("screen-a");

		expect(
			BoundStore.link.getLink(
				createScreenPairKey("screen-a", "detail-a"),
				firstTag,
			),
		).toBeNull();
		expect(
			BoundStore.link.getLink(
				createScreenPairKey("screen-b", "detail-b"),
				secondTag,
			),
		).not.toBeNull();
	});

	it("retains style snapshot metadata alongside bounds for matched tags", () => {
		const tag = makeTag("styled-card");
		const bounds = createBounds(5, 10, 80, 90);
		const styles = { opacity: 0.5, zIndex: 2 };

		registerMeasuredEntry(tag, "screen-a", bounds, styles);

		const snapshot = BoundStore.entry.get(tag, "screen-a");
		expect(snapshot?.bounds).toEqual(bounds);
		expect(snapshot?.styles).toEqual(styles);
	});

	it("keeps non-group matching scoped to the requested tag", () => {
		const nonGroupTag = makeTag("avatar");

		registerSourceAndDestination({
			tag: nonGroupTag,
			sourceScreenKey: "screen-list",
			destinationScreenKey: "screen-detail",
		});

		const pair = BoundStore.link.getPair(
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
