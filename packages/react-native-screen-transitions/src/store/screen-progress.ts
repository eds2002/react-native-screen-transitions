import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import { createVanillaStore } from "./utils/create-vanilla-store";
import { getFallbackSharedValue } from "./utils/shared-value-fallback";

type ScreenProgressState = {
	screenProgress: Record<string, SharedValue<number>>;
};

export const screenProgressStore = createVanillaStore<ScreenProgressState>({
	screenProgress: {},
});

export const ScreenProgressStore = {
	use: screenProgressStore,
	initAllForScreen: (screen: string): void => {
		screenProgressStore.setState(
			(state) => {
				if (!state.screenProgress[screen]) {
					state.screenProgress[screen] = makeMutable(0);
				}

				return state;
			},
			{ raw: true },
		);
	},
	removeAllForScreen: (screen: string): void => {
		screenProgressStore.setState(
			(state) => {
				const sharedValue = state.screenProgress[screen];
				if (sharedValue) {
					cancelAnimation(sharedValue);
				}

				const { [screen]: _, ...remaining } = state.screenProgress;

				return {
					screenProgress: remaining,
				};
			},
			{ raw: true },
		);
	},
	getMutable: (screen: string): SharedValue<number> => {
		const record = screenProgressStore.getState().screenProgress[screen];

		if (!record) {
			return getFallbackSharedValue();
		}

		return record;
	},
	getAllForScreen: (screen: string): SharedValue<number> => {
		return (
			screenProgressStore.getState().screenProgress[screen] ||
			getFallbackSharedValue()
		);
	},
};
