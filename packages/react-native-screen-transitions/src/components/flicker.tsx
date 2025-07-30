import Animated from "react-native-reanimated";
import { _useScreenAnimation } from "@/navigator/components/providers/screen-animation-provider";
import { useScreenKeys } from "@/navigator/contexts/screen-keys";
import { _useAnimatedStyle } from "@/navigator/hooks/animation/use-animated-style";
import { BoundStore } from "@/store/bound-store";
import { ScreenInterpolatorState } from "@/types/state";

const Screen = ({
	children,
	id,
}: {
	children: React.ReactNode;
	id: string;
}) => {
	const { screenInterpolatorState } = _useScreenAnimation();
	const { currentScreenKey } = useScreenKeys();

	const isMeasured = BoundStore.hasBounds(currentScreenKey, id);
	const preventionStyle = _useAnimatedStyle((props) => {
		"worklet";

		if (!id) {
			return { opacity: 1 };
		}

		// Already focused screens don't need flicker prevention
		if (!props.isFocused) {
			return { opacity: 1 };
		}

		if (screenInterpolatorState === ScreenInterpolatorState.UNDEFINED) {
			return { opacity: 1 };
		}

		// Safety net: Skip 1 frame if DEFINED, animating, progress 0, or not measured
		if (
			screenInterpolatorState === ScreenInterpolatorState.DEFINED &&
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

const Navigator = ({
	children,
	screenInterpolatorState,
}: {
	children: React.ReactNode;
	screenInterpolatorState: ScreenInterpolatorState;
}) => {
	const rootStyle = _useAnimatedStyle((props) => {
		"worklet";

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
			props.animating.value === 1 &&
			props.current.progress.value === 0
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
export const Flicker = {
	Navigator: Navigator,
	Screen: Screen,
};
