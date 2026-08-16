import {
	getGroupKeyFromTag,
	getLinkKeyFromTag,
} from "../../../../../../stores/bounds/helpers/link-pairs.helpers";
import type {
	LinkPairsState,
	ScreenPairKey,
} from "../../../../../../stores/bounds/types";
import type { NormalizedTransitionSlotStyle } from "../../../../../../types/animation.types";
import type { BoundaryLocalMeasurement } from "../../../../types";
import { isTeleportEnabled } from "../../../utils/teleport-control";

export const resolveBoundaryPortalPairKey = (
	measurement: BoundaryLocalMeasurement | null,
): ScreenPairKey | null => {
	"worklet";
	return measurement?.pairKey ?? null;
};

export const resolveActiveBoundaryPortalPairKey = (
	measurement: BoundaryLocalMeasurement | null,
	slot: NormalizedTransitionSlotStyle | undefined,
	boundaryId: string,
	pairsState: LinkPairsState,
): ScreenPairKey | null => {
	"worklet";
	if (!measurement) return null;

	const group = getGroupKeyFromTag(boundaryId);
	if (group) {
		const activeId = pairsState[measurement.pairKey]?.groups[group]?.activeId;
		if (activeId !== getLinkKeyFromTag(boundaryId)) return null;
	} else if (!slot) {
		return null;
	}

	if (slot && !isTeleportEnabled(slot.props?.teleport)) return null;
	return measurement.pairKey;
};

export const resolveBoundaryLocalMeasurement = (
	measurement: BoundaryLocalMeasurement | null,
	pairKey: ScreenPairKey,
) => {
	"worklet";
	return measurement?.pairKey === pairKey ? measurement.bounds : null;
};
