import { useCallback, useEffect } from "react";
import {
	type GestureResponderEvent,
	Pressable,
	type PressableProps,
	View,
} from "react-native";
import Animated, {
	type MeasuredDimensions,
	measure,
	runOnJS,
	runOnUI,
	useAnimatedRef,
} from "react-native-reanimated";
import { useAnimatedInterpolatorStyles } from "@/hooks/use-interpolator-styles";
import { useKey } from "@/hooks/use-key";
import { BoundStore } from "@/store/bound-store";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Bounds = ({
	sharedBoundTag,
	onPress,
	style,
	...props
}: { sharedBoundTag: string } & PressableProps) => {
	const key = useKey();
	const animatedRef = useAnimatedRef<View>();
	const { activeTag } = BoundStore.use((state) => state);

	// This logic is sound and can remain as is.
	const storeAndCallOnPress = useCallback(
		(event: GestureResponderEvent, m: MeasuredDimensions) => {
			BoundStore.setScreenBounds(key, sharedBoundTag, m);
			onPress?.(event);
		},
		[key, sharedBoundTag, onPress],
	);

	// This logic is sound and can remain as is.
	const measureComponent = useCallback(() => {
		runOnUI(() => {
			const m = measure(animatedRef);
			if (m) {
				runOnJS(BoundStore.setScreenBounds)(key, sharedBoundTag, m);
			}
		})();
	}, [animatedRef, key, sharedBoundTag]);

	// This logic is sound and can remain as is.
	const handlePress = useCallback(
		(event: GestureResponderEvent) => {
			runOnUI(() => {
				const m = measure(animatedRef);
				if (m) {
					runOnJS(storeAndCallOnPress)(event, m);
				}
			})();
		},
		[animatedRef, storeAndCallOnPress],
	);

	// This logic is sound and can remain as is.
	useEffect(() => {
		if (activeTag === sharedBoundTag) {
			measureComponent();
		}
	}, [activeTag, measureComponent, sharedBoundTag]);

	const { boundStyle } = useAnimatedInterpolatorStyles({ sharedBoundTag });

	return (
		<View>
			{/* <AnimatedPressable
				ref={animatedRef}
				pointerEvents="none"
				style={[style, { opacity: 0, zIndex: -111 }]}
				{...props}
			/> */}

			<AnimatedPressable onPress={onPress} style={[style]} {...props} />
		</View>
	);
};
