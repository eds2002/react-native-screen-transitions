import { makeMutable } from "react-native-reanimated";
import type {
	BoundaryLocalMeasurement,
	BoundaryLocalMeasurementValue,
} from "../types";

/**
 * Where each boundary was last measured for a transition (and for which pair), by the boundary's
 * number. One map for every boundary instead of a shared value each: a list mounting creates none.
 * Only boundaries taking part in a transition (and their overlay hosts) read it.
 */
export const localMeasurements = makeMutable<
	Record<number, BoundaryLocalMeasurement>
>({});

export const createLocalMeasurementRef = (
	key: number,
): BoundaryLocalMeasurementValue => ({ key, map: localMeasurements });

export const readLocalMeasurement = (
	ref: BoundaryLocalMeasurementValue,
): BoundaryLocalMeasurement | null => {
	"worklet";
	return ref.map.get()[ref.key] ?? null;
};

export const writeLocalMeasurement = (
	ref: BoundaryLocalMeasurementValue,
	measurement: BoundaryLocalMeasurement,
) => {
	"worklet";
	ref.map.modify((byBoundary) => {
		"worklet";
		byBoundary[ref.key] = measurement;
		return byBoundary;
	});
};

export const forgetLocalMeasurements = (keys: readonly number[]) => {
	"worklet";
	localMeasurements.modify((byBoundary) => {
		"worklet";
		for (const key of keys) delete byBoundary[key];
		return byBoundary;
	}, false);
};
