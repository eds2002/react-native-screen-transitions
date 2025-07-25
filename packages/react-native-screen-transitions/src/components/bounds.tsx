import { useCallback, useLayoutEffect } from "react";
import {
	Pressable,
	type PressableProps,
	type View,
	type ViewProps,
} from "react-native";
import Animated, {
	type AnimatedProps,
	measure,
	runOnJS,
	runOnUI,
	useAnimatedRef,
} from "react-native-reanimated";
import { useKey } from "@/hooks/use-key";
import { BoundStore } from "@/store/bound-store";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Seperate concerns for now, however, we should integrate this with the existing transition aware components diferentiate with a prop called sharedBoundTag, copies reanimated sharedElementTag
 */
export const Bounds = ({
	sharedBoundTag,
	...props
}: { sharedBoundTag: string } & AnimatedProps<PressableProps>) => {
	const key = useKey();
	const animatedRef = useAnimatedRef<View>();

	const measureComponent = useCallback(() => {
		runOnUI(() => {
			const m = measure(animatedRef);
			if (!m) return;

			runOnJS(BoundStore.setScreenBounds)(key, sharedBoundTag, m);
		});
	}, [animatedRef, key, sharedBoundTag]);

	return <AnimatedPressable ref={animatedRef} {...props} />;
};
