import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import type {
	ComposedGesture,
	GestureType,
} from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { animationValues } from "../animation-engine";
import { ScreenStore } from "../store";
import type {
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
} from "../types";
import { buildGestureDetector } from "../utils/gesture/build-gesture-detector";
import { noopinterpolator } from "../utils/noop-interpolator";
import { useKey } from "./use-key";

interface InternalScreenInterpolationProps extends ScreenInterpolationProps {
	gestureDetector: GestureType | ComposedGesture;
	screenStyleInterpolator: ScreenStyleInterpolator;
}

const useAnimationBuilder = () => {
	const key = useKey();
	const dimensions = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const navigation = useNavigation();

	const progressFallback = useSharedValue(0);
	const gestureDraggingFallback = useSharedValue(0);
	const gestureXFallback = useSharedValue(0);
	const gestureYFallback = useSharedValue(0);
	const normalizedGestureXFallback = useSharedValue(0);
	const normalizedGestureYFallback = useSharedValue(0);

	const currentScreen = ScreenStore.use(
		useCallback((state) => state.screens[key], [key]),
	);

	const actualNextScreen = ScreenStore.use(
		useCallback(
			(state) => {
				const current = state.screens[key];
				if (!current) return undefined;

				const nextKey = state.screenKeys[current.index + 1];
				const nextScreen = nextKey ? state.screens[nextKey] : undefined;

				const shouldUseNext =
					nextScreen?.navigatorKey === current?.navigatorKey;
				return shouldUseNext ? nextScreen : undefined;
			},
			[key],
		),
	);

	const panGesture = useMemo(
		() =>
			buildGestureDetector({
				key,
				progress: animationValues.screenProgress[key],
				screenState: currentScreen || {
					id: key,
					name: key,
					index: 0,
					status: 0,
					closing: false,
				},
				width: dimensions.width,
				height: dimensions.height,
				handleDismiss: (screenBeingDismissed: string) => {
					ScreenStore.handleScreenDismiss(screenBeingDismissed, navigation);
				},
			}),
		[key, currentScreen, dimensions, navigation],
	);

	const getAnimationValuesForScreen = useCallback(
		(screenId: string) => ({
			progress: animationValues.screenProgress[screenId] || progressFallback,
			gesture: {
				isDragging:
					animationValues.gestureDragging[screenId] || gestureDraggingFallback,
				x: animationValues.gestureX[screenId] || gestureXFallback,
				y: animationValues.gestureY[screenId] || gestureYFallback,
				normalizedX:
					animationValues.normalizedGestureX[screenId] ||
					normalizedGestureXFallback,
				normalizedY:
					animationValues.normalizedGestureY[screenId] ||
					normalizedGestureYFallback,
			},
		}),
		[
			progressFallback,
			gestureDraggingFallback,
			gestureXFallback,
			gestureYFallback,
			normalizedGestureXFallback,
			normalizedGestureYFallback,
		],
	);

	return useMemo(() => {
		return {
			current: getAnimationValuesForScreen(key),
			next: actualNextScreen
				? getAnimationValuesForScreen(actualNextScreen.id)
				: undefined,
			layouts: { screen: dimensions },
			insets,
			closing: currentScreen?.closing || false,
			screenStyleInterpolator:
				actualNextScreen?.screenStyleInterpolator ||
				currentScreen?.screenStyleInterpolator ||
				noopinterpolator,
			gestureDetector: panGesture,
		};
	}, [
		key,
		currentScreen,
		actualNextScreen,
		dimensions,
		insets,
		panGesture,
		getAnimationValuesForScreen,
	]);
};

const _useScreenAnimation = (): InternalScreenInterpolationProps => {
	return useAnimationBuilder();
};

const useScreenAnimation = (): ScreenInterpolationProps => {
	const {
		screenStyleInterpolator: _,
		gestureDetector: __,
		...animationProps
	} = useAnimationBuilder();

	return animationProps;
};

export { _useScreenAnimation, useScreenAnimation };
