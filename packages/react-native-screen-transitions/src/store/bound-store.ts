import {
	type MeasuredDimensions,
	makeMutable,
	runOnUI,
	type SharedValue,
} from "react-native-reanimated";
import { createVanillaStore } from "./utils";

type BoundsState = {
	bounds: Record<string, Record<string, SharedValue<MeasuredDimensions>>>;
};

export const boundStore = createVanillaStore<BoundsState>({
	bounds: {},
});

export const BoundStore = {
	use: boundStore,
	setScreenBounds: (
		screenKey: string,
		boundID: string,
		bounds: MeasuredDimensions,
	) => {
		const existingBound = boundStore.getState().bounds[screenKey]?.[boundID];
		if (existingBound) {
			runOnUI(() => {
				"worklet";
				existingBound.value = bounds;
			})();
			return;
		}

		boundStore.setState(
			(state) => {
				return {
					...state,
					bounds: {
						...state.bounds,
						[screenKey]: {
							...state.bounds[screenKey],
							[boundID]: makeMutable(bounds),
						},
					},
				};
			},
			{ raw: true },
		);
	},
	getScreenBounds: (
		screenKey: string,
	): Record<string, SharedValue<MeasuredDimensions>> => {
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
