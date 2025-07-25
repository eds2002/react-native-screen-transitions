import { type MeasuredDimensions, makeMutable } from "react-native-reanimated";
import type {
	BoundKey,
	BoundsMap,
	ExtendedMeasuredDimensions,
} from "@/types/bounds";
import { createVanillaStore } from "./utils";

type BoundsState = {
	bounds: Record<string, BoundsMap>;
	activeTag: BoundKey | null;
};

export const boundStore = createVanillaStore<BoundsState>({
	bounds: {},
	activeTag: null,
});

export const BoundStore = {
	use: boundStore,
	setScreenBounds: (
		screenKey: string,
		boundKey: BoundKey,
		baseBounds: MeasuredDimensions,
	) => {
		boundStore.setState(
			(state) => {
				const modifiedBounds = {
					id: boundKey,
					...baseBounds,
				} satisfies ExtendedMeasuredDimensions;
				return {
					...state,
					bounds: {
						...state.bounds,
						[screenKey]: {
							...state.bounds[screenKey],
							[boundKey]: makeMutable(modifiedBounds),
						},
					},
					activeTag: boundKey,
				};
			},
			{ raw: true },
		);
	},
	getScreenBounds: (screenKey: string): BoundsMap => {
		return boundStore.getState().bounds[screenKey];
	},
	deleteScreenBounds: (screenKey: string): void => {
		boundStore.setState(
			(state) => {
				delete state.bounds[screenKey];
				return state;
			},
			{ raw: true },
		);
	},
};
