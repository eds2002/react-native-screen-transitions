import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import { createStore } from "../utils/create-store";

export type AnimationStoreMap = {
	progress: SharedValue<number>;
	effectiveProgress: SharedValue<number>;
	willAnimate: SharedValue<number>;
	progressAnimating: SharedValue<number>;
	progressSettled: SharedValue<number>;
	closing: SharedValue<number>;
	entering: SharedValue<number>;
};

function createAnimationBag(): AnimationStoreMap {
	return {
		progress: makeMutable(0),
		effectiveProgress: makeMutable(0),
		willAnimate: makeMutable(0),
		closing: makeMutable(0),
		progressAnimating: makeMutable(0),
		progressSettled: makeMutable(1),
		entering: makeMutable(0),
	};
}

/**
 * Route-keyed screen transition state for the public animation lifecycle.
 * `progress` tracks committed transition progress; `effectiveProgress` tracks
 * the hydrated progress after live gesture policy is applied.
 */
export const AnimationStore = createStore<AnimationStoreMap>({
	createBag: createAnimationBag,
	disposeBag: (bag) => {
		cancelAnimation(bag.progress);
		cancelAnimation(bag.effectiveProgress);
		cancelAnimation(bag.willAnimate);
		cancelAnimation(bag.progressAnimating);
		cancelAnimation(bag.progressSettled);
		cancelAnimation(bag.closing);
		cancelAnimation(bag.entering);
	},
});
