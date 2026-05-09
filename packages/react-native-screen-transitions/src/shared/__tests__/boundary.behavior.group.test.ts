import { beforeEach, describe, expect, it } from "bun:test";
import { BoundStore } from "../stores/bounds";
import { createBoundTag } from "../utils/bounds/helpers/create-bound-tag";
import {
	expectResolvedPair,
	hasBoundaryPresence,
	makeContext,
	makeTag,
	registerBoundaryPresence,
	registerSourceAndDestination,
} from "./helpers/bounds-behavior-fixtures";

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("Group Flow", () => {
	it("tracks and updates the active group member id", () => {
		BoundStore.group.setActiveId("photos", "1");
		expect(BoundStore.group.getActiveId("photos")).toBe("1");

		BoundStore.group.setActiveId("photos", "2");
		expect(BoundStore.group.getActiveId("photos")).toBe("2");
	});

	it("resolves grouped tags without mutating the active member", () => {
		BoundStore.group.setActiveId("photos", "1");

		expect(createBoundTag({ id: "2", group: "photos" })).toBe("photos:2");
		expect(BoundStore.group.getActiveId("photos")).toBe("1");
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

		expect(BoundStore.link.getActive(memberOneTag, "detail-1")?.source.screenKey).toBe(
			"list-1",
		);
		expect(BoundStore.link.getActive(memberTwoTag, "detail-2")?.source.screenKey).toBe(
			"list-2",
		);
		expect(BoundStore.link.getActive(memberOneTag, "detail-2")).toBeNull();
		expect(BoundStore.link.getActive(memberTwoTag, "detail-1")).toBeNull();
	});

	it("isolates presence between group members", () => {
		const memberOneTag = makeTag("1", "photos");
		const memberTwoTag = makeTag("2", "photos");

		registerBoundaryPresence(memberOneTag, "screen-a");
		registerBoundaryPresence(memberTwoTag, "screen-a");
		BoundStore.entry.remove(memberOneTag, "screen-a");

		expect(hasBoundaryPresence(memberOneTag, "screen-a")).toBe(false);
		expect(hasBoundaryPresence(memberTwoTag, "screen-a")).toBe(true);
	});

	it("resolves transitions correctly for the active member tag", () => {
		const activeTag = makeTag("2", "photos");
		const inactiveTag = makeTag("1", "photos");

		BoundStore.group.setActiveId("photos", "2");
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

		const pair = BoundStore.link.getPair(
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

		BoundStore.group.setActiveId("photos", "1");
		registerSourceAndDestination({
			tag: memberOneTag,
			sourceScreenKey: "list-1",
			destinationScreenKey: "detail-1",
		});

		BoundStore.group.setActiveId("photos", "2");
		registerSourceAndDestination({
			tag: memberTwoTag,
			sourceScreenKey: "list-2",
			destinationScreenKey: "detail-2",
		});

		expect(BoundStore.link.getActive(memberOneTag, "detail-1")?.source.screenKey).toBe(
			"list-1",
		);
		expect(BoundStore.link.getActive(memberTwoTag, "detail-2")?.source.screenKey).toBe(
			"list-2",
		);
	});

});
