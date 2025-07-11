import {
	cancelAnimation,
	makeMutable,
	runOnJS,
	type SharedValue,
} from "react-native-reanimated";

import { RouteStore } from "./store/index";
import type { RouteState } from "./types";
import { animate } from "./utils/animate";

type RouteKey = string;

export const animationValues: Record<
	string,
	Record<RouteKey, SharedValue<number>>
> = {
	screenProgress: {},
	gestureX: {},
	gestureY: {},
	normalizedGestureX: {},
	normalizedGestureY: {},
	gestureDragging: {},
};

const triggerAnimation = (route: RouteState) => {
	"worklet";
	const { id, closing, status, transitionSpec, onAnimationFinish } = route;

	const progressValue = animationValues.screenProgress[id];

	if (!progressValue && __DEV__) {
		console.warn(`Animation values not found for route: ${id}`);
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

RouteStore.use.subscribeWithSelector(
	(state) => state.routes,
	(currRoutes, prevRoutes) => {
		const currKeys = Object.keys(currRoutes);
		const prevKeys = Object.keys(prevRoutes);

		const incomingKeys = currKeys.filter((k) => !prevKeys.includes(k));
		const removedKeys = prevKeys.filter((k) => !currKeys.includes(k));
		const changedKeys = currKeys.filter((k) => currRoutes[k] !== prevRoutes[k]);

		const animatableValues = Object.values(animationValues);

		for (const incomingKey of incomingKeys) {
			for (const value of animatableValues) {
				value[incomingKey] = makeMutable(0);
			}
		}

		/**
		 * Remove mutable values for removed routes
		 * @see {@link https://docs.swmansion.com/react-native-reanimated/docs/advanced/makeMutable/}
		 */
		for (const removedKey of removedKeys) {
			for (const value of animatableValues) {
				cancelAnimation(value[removedKey]);
				delete value[removedKey];
			}
		}

		for (const changedKey of changedKeys) {
			const currentRoute = currRoutes[changedKey];
			if (currentRoute) {
				triggerAnimation(currentRoute);
			}
		}
	},
);
