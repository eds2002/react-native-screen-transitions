import {
	type MeasuredDimensions,
	makeMutable,
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
				const newState = { ...state };
				delete newState.bounds[screenKey];
				return newState;
			},
			{ raw: true },
		);
	},
};
