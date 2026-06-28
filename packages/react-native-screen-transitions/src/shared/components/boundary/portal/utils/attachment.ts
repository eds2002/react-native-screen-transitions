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
	if (!attachment) {
		return {
			progressScreenKey: null,
			targetScreenKey: null,
		};
	}

	// Matched-screen portals physically live in the matched destination host. If a
	// closing destination is skipped by descriptor resolution, its own progress
	// still owns the attach gate until this attachment is replaced or explicitly
	// cleared. During spam retargets the source pair can advance before the next
	// destination link is complete; keeping the previous attachment avoids a
	// no-host gap while the next destination mounts.
	if (portalAttachTarget === "matched-screen") {
		return {
			progressScreenKey: attachment.matchedScreenKey,
			targetScreenKey: attachment.matchedScreenKey,
		};
	}

	const hasCurrentAttachment = attachment.pairKey === sourcePairKey;

	if (!hasCurrentAttachment) {
		return {
			progressScreenKey: null,
			targetScreenKey: null,
		};
	}

	// Current-screen portals stay mounted in this screen's host, but the visual
	// handoff is still paced by the adjacent destination transition.
	return {
		progressScreenKey: nextScreenKey ?? null,
		targetScreenKey: currentScreenKey,
	};
};
