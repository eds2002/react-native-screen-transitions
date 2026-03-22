import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import type { Layout } from "../types/screen.types";
import { createStore } from "./create-store";

export type AnimationStoreMap = {
	progress: SharedValue<number>;
	animating: SharedValue<number>;
	closing: SharedValue<number>;
	entering: SharedValue<number>;
	targetProgress: SharedValue<number>;
	/** Resolved fraction (contentHeight / screenHeight) for the 'auto' snap point. -1 = not yet measured. */
	autoSnapPoint: SharedValue<number>;
	/** Intrinsic content layout measured from the screen container wrapper. */
	contentLayout: SharedValue<Layout | null>;
};

function createAnimationBag(): AnimationStoreMap {
	return {
		progress: makeMutable(0),
		closing: makeMutable(0),
		animating: makeMutable(0),
		entering: makeMutable(0),
		targetProgress: makeMutable(1),
		autoSnapPoint: makeMutable(-1),
		contentLayout: makeMutable<Layout | null>(null),
	};
}

export const AnimationStore = createStore<AnimationStoreMap>({
	createBag: createAnimationBag,
	disposeBag: (bag) => {
		cancelAnimation(bag.progress);
		cancelAnimation(bag.animating);
		cancelAnimation(bag.closing);
		cancelAnimation(bag.entering);
		cancelAnimation(bag.targetProgress);
		cancelAnimation(bag.autoSnapPoint);
		cancelAnimation(bag.contentLayout);
	},
});
