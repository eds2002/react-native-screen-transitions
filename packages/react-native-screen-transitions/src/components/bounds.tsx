import { type ReactNode, useCallback, useEffect } from "react";
import { Pressable, type View } from "react-native";
import Animated, {
	type MeasuredDimensions,
	measure,
	runOnJS,
	runOnUI,
	useAnimatedRef,
} from "react-native-reanimated";
import { useInterpolatorStyles } from "@/hooks/use-interpolator-styles";
import { useKey } from "@/hooks/use-key";
import { BoundStore } from "@/store/bound-store";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface BoundsProps {
	sharedBoundTag: string;
	onPress?: () => void;
	children: ReactNode;
}

export const Bounds = ({ sharedBoundTag, onPress, children }: BoundsProps) => {
	const key = useKey();
	const animatedRef = useAnimatedRef<View>();
	const { activeTag } = BoundStore.use((state) => state);

	const storeAndCallOnPress = useCallback(
		(m: MeasuredDimensions) => {
			BoundStore.setScreenBounds(key, sharedBoundTag, m);
			onPress?.();
		},
		[key, sharedBoundTag, onPress],
	);

	const measureComponent = useCallback(() => {
		runOnUI(() => {
			const m = measure(animatedRef);
			if (m) {
				runOnJS(BoundStore.setScreenBounds)(key, sharedBoundTag, m);
			}
		})();
	}, [animatedRef, key, sharedBoundTag]);

	const handlePress = useCallback(() => {
		runOnUI(() => {
			console.log("Measuring", sharedBoundTag);
			const m = measure(animatedRef);
			if (m) {
				runOnJS(storeAndCallOnPress)(m);
			}
		})();
	}, [animatedRef, storeAndCallOnPress, sharedBoundTag]);

	useEffect(() => {
		if (activeTag === sharedBoundTag) {
			measureComponent();
		}
	}, [activeTag, measureComponent, sharedBoundTag]);

	const { boundStyle } = useInterpolatorStyles({ sharedBoundTag });

	return (
		<AnimatedPressable
			ref={animatedRef}
			onPress={handlePress}
			style={boundStyle}
		>
			{children}
		</AnimatedPressable>
	);
};
