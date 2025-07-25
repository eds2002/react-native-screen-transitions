import { useAnimatedStyle } from "react-native-reanimated";
import type {
	BaseScreenInterpolationProps,
	ScreenInterpolationProps,
} from "@/types";
import { _useScreenAnimation } from "./use-screen-animation";

const buildWithUtils = (
	props: BaseScreenInterpolationProps,
): ScreenInterpolationProps => {
	"worklet";
	return {
		...props,
		utils: {
			isFocused: props.current && !props.next,
			progress:
				props.current.progress.value + (props.next?.progress.value ?? 0),
		},
	};
};

export const useAnimatedInterpolatorStyles = () => {
	const { screenStyleInterpolator, ...screenInterpolationProps } =
		_useScreenAnimation();

	const contentStyle = useAnimatedStyle(() => {
		"worklet";

		const withUtils = buildWithUtils(screenInterpolationProps);
		return screenStyleInterpolator(withUtils).contentStyle || {};
	});

	const overlayStyle = useAnimatedStyle(() => {
		"worklet";
		const withUtils = buildWithUtils(screenInterpolationProps);
		return screenStyleInterpolator(withUtils).overlayStyle || {};
	});

	return {
		contentStyle,
		overlayStyle,
	};
};
