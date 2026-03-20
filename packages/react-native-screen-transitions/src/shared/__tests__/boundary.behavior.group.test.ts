import { beforeEach, describe, expect, it } from "bun:test";
import { BoundStore } from "../stores/bounds";
import {
	expectResolvedPair,
	makeContext,
	makeTag,
	registerSourceAndDestination,
} from "./helpers/bounds-behavior-fixtures";

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("Group Flow", () => {
	it("builds a grouped tag as group:id", () => {
		expect(makeTag("42", "photos")).toBe("photos:42");
	});

	it("tracks and updates the active group member id", () => {
		BoundStore.setGroupActiveId("photos", "1");
		expect(BoundStore.getGroupActiveId("photos")).toBe("1");

		BoundStore.setGroupActiveId("photos", "2");
		expect(BoundStore.getGroupActiveId("photos")).toBe("2");
	});

	it("isolates links between group members", () => {
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

		expect(BoundStore.getActiveLink(memberOneTag, "detail-1")?.source.screenKey).toBe(
			"list-1",
		);
		expect(BoundStore.getActiveLink(memberTwoTag, "detail-2")?.source.screenKey).toBe(
			"list-2",
		);
		expect(BoundStore.getActiveLink(memberOneTag, "detail-2")).toBeNull();
		expect(BoundStore.getActiveLink(memberTwoTag, "detail-1")).toBeNull();
	});

	it("isolates presence between group members", () => {
		const memberOneTag = makeTag("1", "photos");
		const memberTwoTag = makeTag("2", "photos");

		BoundStore.registerBoundaryPresence(memberOneTag, "screen-a");
		BoundStore.registerBoundaryPresence(memberTwoTag, "screen-a");
		BoundStore.unregisterBoundaryPresence(memberOneTag, "screen-a");

		expect(BoundStore.hasBoundaryPresence(memberOneTag, "screen-a")).toBe(false);
		expect(BoundStore.hasBoundaryPresence(memberTwoTag, "screen-a")).toBe(true);
	});

	it("resolves transitions correctly for the active member tag", () => {
		const activeTag = makeTag("2", "photos");
		const inactiveTag = makeTag("1", "photos");

		BoundStore.setGroupActiveId("photos", "2");
		registerSourceAndDestination({
			tag: inactiveTag,
			sourceScreenKey: "list-1",
			destinationScreenKey: "detail-1",
		});
		registerSourceAndDestination({
			tag: activeTag,
			sourceScreenKey: "list-2",
			destinationScreenKey: "detail-2",
		});

		const pair = BoundStore.resolveTransitionPair(
			activeTag,
			makeContext({
				entering: true,
				previousScreenKey: "list-2",
				currentScreenKey: "detail-2",
			}),
		);

		expectResolvedPair(pair, {
			sourceScreenKey: "list-2",
			destinationScreenKey: "detail-2",
		});
	});

	it("switching active member does not corrupt prior member history", () => {
		const memberOneTag = makeTag("1", "photos");
		const memberTwoTag = makeTag("2", "photos");

		BoundStore.setGroupActiveId("photos", "1");
		registerSourceAndDestination({
			tag: memberOneTag,
			sourceScreenKey: "list-1",
			destinationScreenKey: "detail-1",
		});

		BoundStore.setGroupActiveId("photos", "2");
		registerSourceAndDestination({
			tag: memberTwoTag,
			sourceScreenKey: "list-2",
			destinationScreenKey: "detail-2",
		});

		expect(BoundStore.getActiveLink(memberOneTag, "detail-1")?.source.screenKey).toBe(
			"list-1",
		);
		expect(BoundStore.getActiveLink(memberTwoTag, "detail-2")?.source.screenKey).toBe(
			"list-2",
		);
	});

	it("keeps grouped tag behavior equal to plain-tag behavior once the tag is fixed", () => {
		const groupedTag = makeTag("card", "photos");
		const plainTag = makeTag("card");

		registerSourceAndDestination({
			tag: groupedTag,
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
		});
		registerSourceAndDestination({
			tag: plainTag,
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-b",
		});

		const context = makeContext({
			entering: true,
			previousScreenKey: "screen-a",
			currentScreenKey: "screen-b",
		});

		const groupedPair = BoundStore.resolveTransitionPair(groupedTag, context);
		const plainPair = BoundStore.resolveTransitionPair(plainTag, context);

		expect(groupedPair).toEqual(plainPair);
	});
});
