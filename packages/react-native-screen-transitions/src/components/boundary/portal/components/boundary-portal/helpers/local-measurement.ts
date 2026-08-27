import type { ScreenPairKey } from "../../../../../../stores/bounds/types";
import type { BoundaryLocalMeasurement } from "../../../../types";

export const resolveBoundaryLocalMeasurement = (
	measurement: BoundaryLocalMeasurement | null,
	pairKey: ScreenPairKey,
) => {
	"worklet";
	return measurement?.pairKey === pairKey ? measurement.bounds : null;
};
