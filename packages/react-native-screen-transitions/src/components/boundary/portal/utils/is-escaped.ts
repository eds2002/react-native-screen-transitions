import type { SharedValue } from "react-native-reanimated";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../types/animation.types";
import type { BoundaryLocalMeasurementValue } from "../../types";
import { isLocallyMeasuredFor } from "../../utils/local-measurements";

type Presentation = {
	get: () => {
		owner?: { ready?: boolean; pairKey?: string } | null;
		slots: NormalizedTransitionInterpolatedStyle;
	};
};

export type BoundaryEscapeState = {
	boundaryId: string;
	presentation: Presentation;
	localMeasurement: BoundaryLocalMeasurementValue;
	portalHostReady: SharedValue<boolean>;
};

/**
 * Whether the boundary's frame is in its overlay host this frame: its pair owns it, it was measured
 * for that pair, it has a slot, and its host is placed. The teleport and the boundary's own style
 * both read this, so the frame never leaves without its transforms moving to the host, and never
 * stays inline without them.
 */
export const isBoundaryEscaped = ({
	boundaryId,
	presentation,
	localMeasurement,
	portalHostReady,
}: BoundaryEscapeState): boolean => {
	"worklet";
	const { owner, slots } = presentation.get();
	return (
		!!owner?.ready &&
		!!owner.pairKey &&
		isLocallyMeasuredFor(localMeasurement, owner.pairKey) &&
		slots[boundaryId] !== undefined &&
		portalHostReady.get()
	);
};
