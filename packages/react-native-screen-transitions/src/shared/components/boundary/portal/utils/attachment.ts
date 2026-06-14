import type { BoundaryPortalAttachTarget } from "../../types";

export type PortalAttachment = {
	matchedScreenKey: string;
	pairKey: string;
};

type ResolvePortalAttachmentTargetsParams = {
	attachment: PortalAttachment | null;
	currentScreenKey: string;
	nextScreenKey?: string;
	portalAttachTarget: BoundaryPortalAttachTarget;
	sourcePairKey?: string;
};

export const resolvePortalAttachmentTargets = ({
	attachment,
	currentScreenKey,
	nextScreenKey,
	portalAttachTarget,
	sourcePairKey,
}: ResolvePortalAttachmentTargetsParams) => {
	const hasCurrentAttachment = attachment?.pairKey === sourcePairKey;

	if (!hasCurrentAttachment || !attachment) {
		return {
			progressScreenKey: null,
			targetScreenKey: null,
		};
	}

	// Matched-screen portals physically live in the matched destination host. If a
	// closing destination is skipped by descriptor resolution, its own progress
	// still owns the attach gate until this attachment is replaced or cleared.
	if (portalAttachTarget === "matched-screen") {
		return {
			progressScreenKey: attachment.matchedScreenKey,
			targetScreenKey: attachment.matchedScreenKey,
		};
	}

	// Current-screen portals stay mounted in this screen's host, but the visual
	// handoff is still paced by the adjacent destination transition.
	return {
		progressScreenKey: nextScreenKey ?? null,
		targetScreenKey: currentScreenKey,
	};
};
