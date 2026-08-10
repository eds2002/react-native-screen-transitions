import type { ScreenPairKey } from "../../../../../../stores/bounds/types";
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
): ScreenPairKey | null => {
	"worklet";
	if (slot && !isTeleportEnabled(slot.props?.teleport)) return null;
	return resolveBoundaryPortalPairKey(measurement);
};

export const resolveBoundaryLocalMeasurement = (
	measurement: BoundaryLocalMeasurement | null,
	pairKey: ScreenPairKey,
) => {
	"worklet";
	return measurement?.pairKey === pairKey ? measurement.bounds : null;
};
