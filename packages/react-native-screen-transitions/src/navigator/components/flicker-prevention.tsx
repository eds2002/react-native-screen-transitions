import Animated, { useAnimatedStyle } from "react-native-reanimated";
import type { _BaseScreenInterpolationProps } from "@/types";
import { ScreenInterpolatorState } from "@/types/state";
import { additionalInterpolationProps } from "@/utils/animation/additional-interpolation-props";

export const FlickerPrevention = ({
	children,
	screenInterpolatorState,
	baseInterpolationProps,
}: {
	children: React.ReactNode;
	screenInterpolatorState: ScreenInterpolatorState;
	baseInterpolationProps: Omit<
		_BaseScreenInterpolationProps,
		"screenStyleInterpolator" | "screenInterpolatorState"
	>;
}) => {
	const rootStyle = useAnimatedStyle(() => {
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

		// Safety net, in the case that timing is an issue, we'll skip 1 frame.
		if (
			screenInterpolatorState === ScreenInterpolatorState.DEFINED &&
			interpolationProps.animating.value === 1 &&
			interpolationProps.current.progress.value === 0
		) {
			return { opacity: 0 };
		}

		return { opacity: 1 };
	});

	return (
		<Animated.View style={[rootStyle, { flex: 1 }]} pointerEvents="box-none">
			{children}
		</Animated.View>
	);
};
