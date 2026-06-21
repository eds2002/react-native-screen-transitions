import { describe, expect, it } from "bun:test";
import { resolvePortalAttachmentTargets } from "../../components/boundary/portal/utils/attachment";

describe("resolvePortalAttachmentTargets", () => {
	it("resets stale attachments whose pair no longer matches the owner source pair", () => {
		const targets = resolvePortalAttachmentTargets({
			attachment: {
				matchedScreenKey: "b",
				pairKey: "a-b",
			},
			currentScreenKey: "a",
			nextScreenKey: "c",
			portalAttachTarget: "matched-screen",
			sourcePairKey: "a-c",
		});

		expect(targets).toEqual({
			progressScreenKey: null,
			targetScreenKey: null,
		});
	});

	it("keeps matched-screen progress tied to the attached destination when next skips a closing route", () => {
		const targets = resolvePortalAttachmentTargets({
			attachment: {
				matchedScreenKey: "b",
				pairKey: "a-b",
			},
			currentScreenKey: "a",
			nextScreenKey: "c",
			portalAttachTarget: "matched-screen",
			sourcePairKey: "a-b",
		});

		expect(targets).toEqual({
			progressScreenKey: "b",
			targetScreenKey: "b",
		});
	});

	it("keeps current-screen host ownership while using next progress for the attach gate", () => {
		const targets = resolvePortalAttachmentTargets({
			attachment: {
				matchedScreenKey: "b",
				pairKey: "a-b",
			},
			currentScreenKey: "a",
			nextScreenKey: "b",
			portalAttachTarget: "current-screen",
			sourcePairKey: "a-b",
		});

		expect(targets).toEqual({
			progressScreenKey: "b",
			targetScreenKey: "a",
		});
	});

	it("does not resolve targets without an attachment", () => {
		const targets = resolvePortalAttachmentTargets({
			attachment: null,
			currentScreenKey: "a",
			nextScreenKey: "b",
			portalAttachTarget: "matched-screen",
			sourcePairKey: "a-b",
		});

		expect(targets).toEqual({
			progressScreenKey: null,
			targetScreenKey: null,
		});
	});
});
