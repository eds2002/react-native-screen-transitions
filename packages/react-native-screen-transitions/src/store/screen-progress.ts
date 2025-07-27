import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import { createVanillaStore } from "./utils/create-vanilla-store";

type ScreenProgressState = {
	screenProgress: Record<string, SharedValue<number>>;
	animating: Record<string, SharedValue<number>>;
};

const animatingFallback = makeMutable(0);
const screenProgressFallback = makeMutable(0);

export const screenProgressStore = createVanillaStore<ScreenProgressState>({
	screenProgress: {},
	animating: {},
});

export const ScreenProgressStore = {
	use: screenProgressStore,
	initAllForScreen: (screen: string): void => {
		screenProgressStore.setState(
			(state) => {
				state.screenProgress[screen] = makeMutable(0);
				state.animating[screen] = makeMutable(0);

				return state;
			},
			{ raw: true },
		);
	},
	removeAllForScreen: (screen: string): void => {
		screenProgressStore.setState(
			(state) => {
				if (state.screenProgress[screen]) {
					cancelAnimation(state.screenProgress[screen]);
				}
				if (state.animating[screen]) {
					cancelAnimation(state.animating[screen]);
				}

				const { [screen]: _, ...remainingScreenProgress } =
					state.screenProgress;
				const { [screen]: __, ...remainingAnimating } = state.animating;

				return {
					screenProgress: remainingScreenProgress,
					animating: remainingAnimating,
				};
			},
			{ raw: true },
		);
	},
	getAnimatingStatus: (screen: string): SharedValue<number> => {
		const record = screenProgressStore.getState().animating[screen];

		if (!record) {
			return animatingFallback;
		}

		return record;
	},
	getScreenProgress: (screen: string): SharedValue<number> => {
		const record = screenProgressStore.getState().screenProgress[screen];

		if (!record) {
			return screenProgressFallback;
		}

		return record;
	},
};
