import { beforeEach, describe, expect, it } from "bun:test";
import { BoundStore } from "../../stores/bounds";
import { createScreenPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";
import { createBoundTag } from "../../utils/bounds/helpers/create-bound-tag";
import {
	hasBoundaryPresence,
	makeTag,
	registerBoundaryPresence,
	registerSourceAndDestination,
} from "./helpers/bounds-behavior-fixtures";

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("Concrete Group-Like Tags", () => {
	it("formats concrete boundary tags as group:id", () => {
		expect(createBoundTag({ id: "2", group: "photos" })).toBe("photos:2");
	});

	it("isolates links between concrete group-like tags", () => {
		const memberOneTag = makeTag("1", "photos");
		const memberTwoTag = makeTag("2", "photos");

		registerSourceAndDestination({
			tag: memberOneTag,
			sourceScreenKey: "list-1",
			destinationScreenKey: "detail-1",
		});
		registerSourceAndDestination({
			tag: memberTwoTag,
			sourceScreenKey: "list-2",
			destinationScreenKey: "detail-2",
		});

		expect(
			BoundStore.link.getLink(
				createScreenPairKey("list-1", "detail-1"),
				memberOneTag,
			)?.source.screenKey,
		).toBe("list-1");
		expect(
			BoundStore.link.getLink(
				createScreenPairKey("list-2", "detail-2"),
				memberTwoTag,
			)?.source.screenKey,
		).toBe("list-2");
		expect(
			BoundStore.link.getLink(
				createScreenPairKey("list-1", "detail-2"),
				memberOneTag,
			),
		).toBeNull();
		expect(
			BoundStore.link.getLink(
				createScreenPairKey("list-2", "detail-1"),
				memberTwoTag,
			),
		).toBeNull();
	});

	it("isolates presence between concrete group-like tags", () => {
		const memberOneTag = makeTag("1", "photos");
		const memberTwoTag = makeTag("2", "photos");

		registerBoundaryPresence(memberOneTag, "screen-a");
		registerBoundaryPresence(memberTwoTag, "screen-a");
		BoundStore.entry.remove(memberOneTag, "screen-a");

		expect(hasBoundaryPresence(memberOneTag, "screen-a")).toBe(false);
		expect(hasBoundaryPresence(memberTwoTag, "screen-a")).toBe(true);
	});
});
