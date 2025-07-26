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
		isFocused,
		progress,
		interpolate,
	};
};

export const useInterpolatorStyles = ({
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
		const propsWithUtils = buildWithUtils(screenInterpolationProps);
		return screenStyleInterpolator(propsWithUtils).contentStyle || {};
	});

	const overlayStyle = useAnimatedStyle(() => {
		"worklet";
		const propsWithUtils = buildWithUtils(screenInterpolationProps);
		return screenStyleInterpolator(propsWithUtils).overlayStyle || {};
	});

	const boundStyle = useAnimatedStyle(() => {
		"worklet";

		if (!sharedBoundTag) {
			return {};
		}

		const propsWithUtils = buildWithUtils(screenInterpolationProps);
		const animatedStyles =
			screenStyleInterpolator(propsWithUtils).boundStyle?.[sharedBoundTag];

		if (animatedStyles && Object.keys(animatedStyles).length > 0) {
			return animatedStyles;
		}

		const activeTag =
			screenInterpolationProps.previous?.activeBoundId ||
			screenInterpolationProps.current?.activeBoundId;

		// Only hide if this specific tag is the one being transitioned AND it's the incoming element. This helps us avoid flickering
		if (activeTag === sharedBoundTag) {
			const isTransitioning =
				propsWithUtils.progress > 0 && propsWithUtils.progress < 2;
			const isIncomingElement = propsWithUtils.isFocused;

			if (isTransitioning && isIncomingElement && propsWithUtils.previous) {
				return {
					opacity: 0,
				};
			}
		}

		return {};
	});

	return {
		contentStyle,
		overlayStyle,
		boundStyle,
	};
};
