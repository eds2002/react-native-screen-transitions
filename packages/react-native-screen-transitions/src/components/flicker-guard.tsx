import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useScreenKeys } from "@/navigator/contexts/screen-keys";
import { _useRootScreenAnimation } from "@/navigator/hooks/animation/use-root-screen-animation";
import { BoundStore } from "@/store/bound-store";
import type { BaseScreenInterpolationProps } from "@/types";
import { ScreenInterpolatorState } from "@/types/state";
import { additionalInterpolationProps } from "@/utils/animation/additional-interpolation-props";

const ChildrenFlickerPrevention = ({
	children,
	id,
}: {
	children: React.ReactNode;
	id: string;
}) => {
	const { interpolator, interpolatorProps } = _useRootScreenAnimation();
	const { currentScreenKey } = useScreenKeys();

	const isMeasured = BoundStore.hasBounds(currentScreenKey, id);
	const preventionStyle = useAnimatedStyle(() => {
		"worklet";

		if (!id) {
			return { opacity: 1 };
		}

		const props = additionalInterpolationProps(interpolatorProps);

		// Already focused screens don't need flicker prevention
		if (!props.isFocused) {
			return { opacity: 1 };
		}

		if (
			interpolator.screenInterpolatorState === ScreenInterpolatorState.UNDEFINED
		) {
			return { opacity: 1 };
		}

		// Safety net: Skip 1 frame if DEFINED, animating, progress 0, or not measured
		if (
			interpolator.screenInterpolatorState ===
				ScreenInterpolatorState.DEFINED &&
			((props.animating.value === 1 && props.current.progress.value === 0) ||
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

const RootFlickerPrevention = ({
	children,
	screenInterpolatorState,
	interpolatorProps,
}: {
	children: React.ReactNode;
	screenInterpolatorState: ScreenInterpolatorState;
	interpolatorProps: BaseScreenInterpolationProps;
}) => {
	const rootStyle = useAnimatedStyle(() => {
		"worklet";

		const props = additionalInterpolationProps(interpolatorProps);

		// Already focused screens don't need flicker prevention
		if (!props.isFocused) {
			return { opacity: 1 };
		}

		if (screenInterpolatorState === ScreenInterpolatorState.UNDETERMINED) {
			return { opacity: 0 };
		}

		// Safety net, in the case that timing is an issue, we'll skip 1 frame.
		if (
			screenInterpolatorState === ScreenInterpolatorState.DEFINED &&
			interpolatorProps.animating.value === 1 &&
			interpolatorProps.current.progress.value === 0
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

/**
 * Both these components follow the same pattern, except that the children is handled a little differnetly, this is to prevent flickering on bound animations or custom styles.
 */
export const FlickerGuard = {
	Root: RootFlickerPrevention,
	Children: ChildrenFlickerPrevention,
};
