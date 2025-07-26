import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import { createVanillaStore } from "./utils/create-vanilla-store";

type GestureKey =
	| "x"
	| "y"
	| "normalizedX"
	| "normalizedY"
	| "gestureDragging"
	| "isDismissing"
	| "isDragging";

type GestureState = Record<GestureKey, Record<string, SharedValue<number>>>;

const mutableFallback = makeMutable(0);

export const gestureStore = createVanillaStore<GestureState>({
	x: {},
	y: {},
	normalizedX: {},
	normalizedY: {},
	gestureDragging: {},
	isDismissing: {},
	isDragging: {},
});

export const GestureStore = {
	use: gestureStore,
	initAllForScreen: (screen: string): void => {
		gestureStore.setState(
			(state) => {
				const keys = Object.keys(state) as Array<keyof GestureState>;

				// Create all SharedValues for this screen at once
				keys.forEach((key) => {
					if (!state[key][screen]) {
						state[key][screen] = makeMutable(0);
					}
				});

				return state;
			},
			{ raw: true },
		);
	},

	removeAllForScreen: (screen: string): void => {
		gestureStore.setState(
			(state) => {
				const newState: GestureState = {} as GestureState;

				const gestureKeys = Object.keys(state) as Array<keyof GestureState>;

				gestureKeys.forEach((key) => {
					const record = state[key];
					const newRecord = { ...record };

					if (screen in newRecord) {
						const sharedValue = newRecord[screen];
						if (sharedValue) {
							cancelAnimation(sharedValue);
						}
						delete newRecord[screen];
					}

					newState[key] = newRecord;
				});

				return newState;
			},
			{ raw: true },
		);
	},
	getMutable: (
		screen: string,
		key: keyof GestureState,
	): SharedValue<number> => {
		const record = gestureStore.getState()[key];

		if (!record[screen]) {
			return mutableFallback;
		}

		return record[screen];
	},
	getAllForScreen: (
		screen: string,
	): Record<keyof GestureState, SharedValue<number>> => {
		const keys = Object.keys(gestureStore.getState()) as Array<
			keyof GestureState
		>;

		return keys.reduce(
			(acc, key) => {
				acc[key] =
					gestureStore.getState()[key as keyof GestureState][screen] ||
					mutableFallback;
				return acc;
			},
			{} as Record<keyof GestureState, SharedValue<number>>,
		);
	},
};
