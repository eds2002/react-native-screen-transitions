import {
	interpolate as reInterpolate,
	useAnimatedStyle,
} from "react-native-reanimated";
import type {
	BaseScreenInterpolationProps,
	ScreenInterpolationProps,
} from "@/types";
import { _useScreenAnimation } from "./use-screen-animation";

const buildWithUtils = (
	props: BaseScreenInterpolationProps,
): ScreenInterpolationProps => {
	"worklet";
	const isFocused = props.current && !props.next;
	const progress =
		props.current.progress.value + (props.next?.progress.value ?? 0);
	const interpolate = (inputRange: number[], outputRange: number[]) => {
		"worklet";
		return reInterpolate(progress, inputRange, outputRange);
	};

	return {
		...props,
		utils: {
			isFocused,
			progress,
			interpolate,
		},
	};
};

export const useAnimatedInterpolatorStyles = ({
	sharedBoundTag,
}: {
	sharedBoundTag?: string;
} = {}) => {
	const { screenStyleInterpolator, ...screenInterpolationProps } =
		_useScreenAnimation();

	if (__DEV__) {
		/**
		 * With react-native-worklets, we can call a fn called isWorkletFunction, we'll use this to improve the user experience to warn users that they need to mark their screenStyleInterpolator as a worklet, if not the app will crash.
		 */
	}

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

	const boundStyle = useAnimatedStyle(() => {
		"worklet";
		if (!sharedBoundTag) {
			return {};
		}

		const withUtils = buildWithUtils(screenInterpolationProps);
		return (
			screenStyleInterpolator(withUtils).boundStyle?.[sharedBoundTag] || {}
		);
	});

	return {
		contentStyle,
		overlayStyle,
		boundStyle,
	};
};
