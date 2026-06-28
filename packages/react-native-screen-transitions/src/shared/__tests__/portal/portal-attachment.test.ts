import { describe, expect, it } from "bun:test";
import { resolvePortalAttachmentTargets } from "../../components/boundary/portal/utils/attachment";

describe("resolvePortalAttachmentTargets", () => {
	it("keeps matched-screen attachments while the next source pair is pending", () => {
		const targets = resolvePortalAttachmentTargets({
			attachment: {
				matchedScreenKey: "b",
				pairKey: "a-b",
			},
			currentScreenKey: "a",
			portalAttachTarget: "matched-screen",
			sourcePairKey: "a-c",
		});

		expect(targets).toEqual({
			targetScreenKey: "b",
		});
	});

	it("resets stale current-screen attachments whose pair no longer matches the owner source pair", () => {
		const targets = resolvePortalAttachmentTargets({
			attachment: {
				matchedScreenKey: "b",
				pairKey: "a-b",
			},
			currentScreenKey: "a",
			portalAttachTarget: "current-screen",
			sourcePairKey: "a-c",
		});

		expect(targets).toEqual({
			targetScreenKey: null,
		});
	});

	it("keeps the matched-screen target on the attached destination when next skips a closing route", () => {
		const targets = resolvePortalAttachmentTargets({
			attachment: {
				matchedScreenKey: "b",
				pairKey: "a-b",
			},
			currentScreenKey: "a",
			portalAttachTarget: "matched-screen",
			sourcePairKey: "a-b",
		});

		expect(targets).toEqual({
			targetScreenKey: "b",
		});
	});

	it("keeps current-screen host ownership while the source pair matches", () => {
		const targets = resolvePortalAttachmentTargets({
			attachment: {
				matchedScreenKey: "b",
				pairKey: "a-b",
			},
			currentScreenKey: "a",
			portalAttachTarget: "current-screen",
			sourcePairKey: "a-b",
		});

		expect(targets).toEqual({
			targetScreenKey: "a",
		});
	});

	it("does not resolve targets without an attachment", () => {
		const targets = resolvePortalAttachmentTargets({
			attachment: null,
			currentScreenKey: "a",
			portalAttachTarget: "matched-screen",
			sourcePairKey: "a-b",
		});

		expect(targets).toEqual({
			targetScreenKey: null,
		});
	});
});
