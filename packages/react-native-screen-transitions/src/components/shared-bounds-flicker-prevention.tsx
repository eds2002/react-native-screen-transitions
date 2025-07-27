import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { BoundStore } from "@/store/bound-store";
import type { _BaseScreenInterpolationProps } from "@/types";
import { ScreenInterpolatorState } from "@/types/state";
import { additionalInterpolationProps } from "@/utils/animation/additional-interpolation-props";

export const SharedBoundsFlickerPrevention = ({
	children,
	screenInterpolatorState,
	baseInterpolationProps,
	sharedBoundTag,
	screenKey,
}: {
	children: React.ReactNode;
	screenInterpolatorState: ScreenInterpolatorState;
	baseInterpolationProps: Omit<
		_BaseScreenInterpolationProps,
		"screenStyleInterpolator" | "screenInterpolatorState"
	>;
	sharedBoundTag: string;
	screenKey: string;
}) => {
	const isMeasured = BoundStore.hasBounds(screenKey, sharedBoundTag);
	const preventionStyle = useAnimatedStyle(() => {
		"worklet";

		const interpolationProps = additionalInterpolationProps(
			baseInterpolationProps,
		);

		// Already focused screens don't need flicker prevention
		if (!interpolationProps.isFocused) {
			return { opacity: 1 };
		}

		if (screenInterpolatorState === ScreenInterpolatorState.UNDETERMINED) {
			return { opacity: 0 };
		}

		// Safety net: Skip 1 frame if DEFINED, animating, progress 0, or not measured
		if (
			screenInterpolatorState === ScreenInterpolatorState.DEFINED &&
			((interpolationProps.animating.value === 1 &&
				interpolationProps.current.progress.value === 0) ||
				!isMeasured)
		) {
			return { opacity: 0 };
		}

		return { opacity: 1 };
	});

	return <Animated.View style={[preventionStyle]}>{children}</Animated.View>;
};
