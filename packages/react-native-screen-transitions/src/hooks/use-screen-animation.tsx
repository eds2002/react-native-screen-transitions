import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import type {
	ComposedGesture,
	GestureType,
} from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "@/store/utils/use-shallow";
import { animationValues } from "../animation-engine";
import { RouteStore } from "../store";
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

	const { currentRoute, nextRoute } = RouteStore.use(
		useShallow(({ routes, routeKeys }) => {
			const current = routes[key];

			if (!current) {
				return { currentRoute: undefined, nextRoute: undefined };
			}

			const currentScreenIndex = current.index;
			const nextKey = routeKeys[currentScreenIndex + 1];

			return {
				currentRoute: current,
				nextRoute: nextKey ? routes[nextKey] : undefined,
			};
		}),
	);

	const panGesture = useMemo(
		() =>
			buildGestureDetector({
				key,
				progress: animationValues.screenProgress[key],
				config: currentRoute || {
					id: key,
					name: key,
					index: 0,
					status: 0,
					closing: false,
				},
				width: dimensions.width,
				height: dimensions.height,
				goBack: navigation.goBack,
			}),
		[key, currentRoute, dimensions.width, dimensions.height, navigation.goBack],
	);

	// We'll avoid using makeMutable as fallbacks since useSharedValues are automatically garbage collected
	const progressFallback = useSharedValue(0);
	const gestureDraggingFallback = useSharedValue(0);
	const gestureXFallback = useSharedValue(0);
	const gestureYFallback = useSharedValue(0);
	const normalizedGestureXFallback = useSharedValue(0);
	const normalizedGestureYFallback = useSharedValue(0);

	return useMemo(() => {
		return {
			current: {
				progress: animationValues.screenProgress[key] || progressFallback,
				gesture: {
					isDragging:
						animationValues.gestureDragging[key] || gestureDraggingFallback,
					x: animationValues.gestureX[key] || gestureXFallback,
					y: animationValues.gestureY[key] || gestureYFallback,
					normalizedX:
						animationValues.normalizedGestureX[key] ||
						normalizedGestureXFallback,
					normalizedY:
						animationValues.normalizedGestureY[key] ||
						normalizedGestureYFallback,
				},
			},
			next:
				nextRoute && animationValues.screenProgress[nextRoute.id]
					? {
							progress: animationValues.screenProgress[nextRoute.id],
							gesture: {
								isDragging:
									animationValues.gestureDragging[nextRoute.id] ||
									gestureDraggingFallback,
								x: animationValues.gestureX[nextRoute.id] || gestureXFallback,
								y: animationValues.gestureY[nextRoute.id] || gestureYFallback,
								normalizedX:
									animationValues.normalizedGestureX[nextRoute.id] ||
									normalizedGestureXFallback,
								normalizedY:
									animationValues.normalizedGestureY[nextRoute.id] ||
									normalizedGestureYFallback,
							},
						}
					: undefined,
			layouts: { screen: dimensions },
			insets,
			closing: currentRoute?.closing || false,
			screenStyleInterpolator:
				nextRoute?.screenStyleInterpolator ||
				currentRoute?.screenStyleInterpolator ||
				noopinterpolator,

			gestureDetector: panGesture,
		};
	}, [
		key,
		currentRoute,
		nextRoute,
		dimensions,
		insets,
		panGesture,
		progressFallback,
		gestureDraggingFallback,
		gestureXFallback,
		gestureYFallback,
		normalizedGestureXFallback,
		normalizedGestureYFallback,
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
