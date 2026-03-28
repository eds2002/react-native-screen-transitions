import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import { createStore } from "../utils/create-store";

export type AnimationStoreMap = {
	progress: SharedValue<number>;
	willAnimate: SharedValue<number>;
	animating: SharedValue<number>;
	closing: SharedValue<number>;
	entering: SharedValue<number>;
};

function createAnimationBag(): AnimationStoreMap {
	return {
		progress: makeMutable(0),
		willAnimate: makeMutable(0),
		closing: makeMutable(0),
		animating: makeMutable(0),
		entering: makeMutable(0),
	};
}

/**
 * Route-keyed screen transition state for the public animation lifecycle. These
 * shared values track the current progress, whether a transition is about to
 * begin, and whether a screen is entering, closing, or actively animating.
 */
export const AnimationStore = createStore<AnimationStoreMap>({
	createBag: createAnimationBag,
	disposeBag: (bag) => {
		cancelAnimation(bag.progress);
		cancelAnimation(bag.willAnimate);
		cancelAnimation(bag.animating);
		cancelAnimation(bag.closing);
		cancelAnimation(bag.entering);
	},
});
