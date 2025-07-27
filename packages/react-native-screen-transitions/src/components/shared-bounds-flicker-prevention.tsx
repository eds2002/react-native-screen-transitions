import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { BoundStore } from "@/store/bound-store";
import type {
	_BaseScreenInterpolationProps,
	ScreenStyleInterpolator,
} from "@/types";
import { ScreenInterpolatorState } from "@/types/state";
import { additionalInterpolationProps } from "@/utils/animation/additional-interpolation-props";

export const SharedBoundsFlickerPrevention = ({
	children,
	screenInterpolatorState,
	baseInterpolationProps,
	sharedBoundTag,
	screenKey,
	screenStyleInterpolator,
}: {
	children: React.ReactNode;
	screenInterpolatorState: ScreenInterpolatorState;
	baseInterpolationProps: Omit<
		_BaseScreenInterpolationProps,
		"screenStyleInterpolator" | "screenInterpolatorState"
	>;
	sharedBoundTag: string;
	screenKey: string;
	screenStyleInterpolator: ScreenStyleInterpolator;
}) => {
	const isMeasured = BoundStore.hasBounds(screenKey, sharedBoundTag);
	const preventionStyle = useAnimatedStyle(() => {
		"worklet";

		const interpolationProps = additionalInterpolationProps(
			baseInterpolationProps,
		);

		// Already focused screens don't need flicker prevention
		if (!interpolationProps.isFocused) {
			console.log("BOUNDS VISIBLE - not focused");
			return { opacity: 1 };
		}

		// Hide during undetermined
		if (screenInterpolatorState === ScreenInterpolatorState.UNDETERMINED) {
			console.log("BOUNDS HIDING - undetermined");
			return { opacity: 0 };
		}

		// Safety net: Skip 1 frame if DEFINED, animating, progress 0, or not measured
		if (
			screenInterpolatorState === ScreenInterpolatorState.DEFINED &&
			((interpolationProps.animating.value === 1 &&
				interpolationProps.current.progress.value === 0) ||
				!isMeasured)
		) {
			console.log("BOUNDS HIDING - safety skip (timing/measurement)");
			return { opacity: 0 };
		}

		// Additional diagnosis: Check if styles are empty
		const styles =
			screenStyleInterpolator(interpolationProps)[sharedBoundTag] || {};
		const isStylesEmpty = Object.keys(styles).length === 0;
		console.log("BOUNDS STYLES:", "isEmpty", isStylesEmpty, "styles", styles);

		// Only hide for empty styles if not measured yet - prevent stuck hiding
		if (isStylesEmpty && !isMeasured) {
			console.log("BOUNDS HIDING - empty styles (waiting for measurement)");
			return { opacity: 0 };
		}

		console.log("BOUNDS VISIBLE - ready");
		return { opacity: 1 };
	});

	return <Animated.View style={[preventionStyle]}>{children}</Animated.View>;
};

