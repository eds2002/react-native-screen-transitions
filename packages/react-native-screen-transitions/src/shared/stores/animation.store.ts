import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import { createStore } from "../utils/create-store";

export type AnimationStoreMap = {
	transitionProgress: SharedValue<number>;
	visualProgress: SharedValue<number>;
	willAnimate: SharedValue<number>;
	progressAnimating: SharedValue<number>;
	progressSettled: SharedValue<number>;
	closing: SharedValue<number>;
	entering: SharedValue<number>;
};

function createAnimationBag(): AnimationStoreMap {
	return {
		transitionProgress: makeMutable(0),
		visualProgress: makeMutable(0),
		willAnimate: makeMutable(0),
		closing: makeMutable(0),
		progressAnimating: makeMutable(0),
		progressSettled: makeMutable(1),
		entering: makeMutable(0),
	};
}

/**
 * Route-keyed screen transition state for the public animation lifecycle.
 * `transitionProgress` tracks committed transition progress; `visualProgress`
 * tracks hydrated progress after live gestures are applied.
 */
export const AnimationStore = createStore<AnimationStoreMap>({
	createBag: createAnimationBag,
	disposeBag: (bag) => {
		cancelAnimation(bag.transitionProgress);
		cancelAnimation(bag.visualProgress);
		cancelAnimation(bag.willAnimate);
		cancelAnimation(bag.progressAnimating);
		cancelAnimation(bag.progressSettled);
		cancelAnimation(bag.closing);
		cancelAnimation(bag.entering);
	},
});
