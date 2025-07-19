import {
	cancelAnimation,
	makeMutable,
	runOnJS,
	type SharedValue,
} from "react-native-reanimated";

import { ScreenStore } from "./store/index";
import type { ScreenState } from "./types";
import { animate } from "./utils/animate";

type ScreenKey = string;

export const animationValues: Record<
	string,
	Record<ScreenKey, SharedValue<number>>
> = {
	screenProgress: {},
	gestureX: {},
	gestureY: {},
	normalizedGestureX: {},
	normalizedGestureY: {},
	gestureDragging: {},
	isDismissing: {},
};

const triggerAnimation = (screen: ScreenState) => {
	"worklet";
	const { id, closing, status, transitionSpec, onAnimationFinish } = screen;

	const progressValue = animationValues.screenProgress[id];

	if (!progressValue && __DEV__) {
		console.warn(`Animation values not found for screen: ${id}`);
		return;
	}

	const animationConfig = closing
		? transitionSpec?.close
		: transitionSpec?.open;

	const targetValue = status || 0;

	progressValue.value = animate(targetValue, animationConfig, (finished) => {
		"worklet";
		if (finished && onAnimationFinish) {
			runOnJS(onAnimationFinish)(true);
		}
	});
};

ScreenStore.use.subscribeWithSelector(
	(state) => state.screens,
	(currScreens, prevScreens) => {
		const currKeys = Object.keys(currScreens);
		const prevKeys = Object.keys(prevScreens);

		const incomingKeys = currKeys.filter((k) => !prevKeys.includes(k));
		const removedKeys = prevKeys.filter((k) => !currKeys.includes(k));
		const changedKeys = currKeys.filter(
			(k) => currScreens[k] !== prevScreens[k],
		);

		const animatableValues = Object.values(animationValues);

		for (const incomingKey of incomingKeys) {
			for (const value of animatableValues) {
				value[incomingKey] = makeMutable(0);
			}
		}

		/**
		 * Remove mutable values for removed screens
		 * @see {@link https://docs.swmansion.com/react-native-reanimated/docs/advanced/makeMutable/}
		 */
		for (const removedKey of removedKeys) {
			for (const value of animatableValues) {
				cancelAnimation(value[removedKey]);
				delete value[removedKey];
			}
		}

		for (const changedKey of changedKeys) {
			const currentScreen = currScreens[changedKey];
			if (currentScreen) {
				triggerAnimation(currentScreen);
			}
		}
	},
);
