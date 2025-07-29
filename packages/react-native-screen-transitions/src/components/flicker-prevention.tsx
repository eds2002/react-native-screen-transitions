import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useScreenKeys } from "@/navigator/contexts/screen-keys";
import { _useRootScreenAnimation } from "@/navigator/hooks/animation/use-root-screen-animation";
import { BoundStore } from "@/store/bound-store";
import { ScreenInterpolatorState } from "@/types/state";
import { additionalInterpolationProps } from "@/utils/animation/additional-interpolation-props";

export const FlickerPrevention = ({
	children,
	id,
}: {
	children: React.ReactNode;
	id: string;
}) => {
	const { screenInterpolatorState, ...screenInterpolationProps } =
		_useRootScreenAnimation();
	const { currentScreenKey } = useScreenKeys();

	const isMeasured = BoundStore.hasBounds(currentScreenKey, id);
	const preventionStyle = useAnimatedStyle(() => {
		"worklet";

		if (!id) {
			return { opacity: 1 };
		}

		const interpolationProps = additionalInterpolationProps(
			screenInterpolationProps,
		);

		// Already focused screens don't need flicker prevention
		if (!interpolationProps.isFocused) {
			return { opacity: 1 };
		}

		if (screenInterpolatorState === ScreenInterpolatorState.UNDEFINED) {
			return { opacity: 1 };
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

	return (
		<Animated.View style={[preventionStyle]} pointerEvents="box-none">
			{children}
		</Animated.View>
	);
};
