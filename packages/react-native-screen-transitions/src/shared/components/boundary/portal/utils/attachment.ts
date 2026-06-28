import type { BoundaryPortalAttachTarget } from "../../types";

export type PortalAttachment = {
	matchedScreenKey: string;
	pairKey: string;
};

type ResolvePortalAttachmentTargetsParams = {
	attachment: PortalAttachment | null;
	currentScreenKey: string;
	portalAttachTarget: BoundaryPortalAttachTarget;
	sourcePairKey?: string;
};

export const resolvePortalAttachmentTargets = ({
	attachment,
	currentScreenKey,
	portalAttachTarget,
	sourcePairKey,
}: ResolvePortalAttachmentTargetsParams) => {
	if (!attachment) {
		return { targetScreenKey: null };
	}

	// Matched-screen portals physically live in the matched destination host. If a
	// closing destination is skipped by descriptor resolution, it stays the target
	// until this attachment is replaced or explicitly cleared. During spam
	// retargets the source pair can advance before the next destination link is
	// complete; keeping the previous attachment avoids a no-host gap while the next
	// destination mounts.
	if (portalAttachTarget === "matched-screen") {
		return { targetScreenKey: attachment.matchedScreenKey };
	}

	const hasCurrentAttachment = attachment.pairKey === sourcePairKey;

	if (!hasCurrentAttachment) {
		return { targetScreenKey: null };
	}

	// Current-screen portals stay mounted in this screen's host.
	return { targetScreenKey: currentScreenKey };
};
