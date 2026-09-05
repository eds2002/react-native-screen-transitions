import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { ScrollStore } from "../../../../stores/scroll.store";
import { useBuilderStore } from "../../builder";
import type { ScreenOptionsContextValue } from "../options/types";
import { useScreenGestureConfig } from "./ownership/hooks/use-screen-gesture-config";
import { useBuildPanGesture } from "./pan/use-build-pan-gesture";
import { useBuildPinchGesture } from "./pinch/use-build-pinch-gesture";
import { type GestureCompositionOwner, NO_GESTURE_OWNERS } from "./types";

export function useScreenGestures(
	screenOptions: ScreenOptionsContextValue,
	onDismissRequest?: () => void,
) {
	const currentScreenKey = useBuilderStore(
		(store) => store.derivations.currentScreenKey,
	);
	const gestureConfig = useScreenGestureConfig();
	const scrollState = ScrollStore.getValue(currentScreenKey, "coordination");
	const gestureOwners = useSharedValue({ ...NO_GESTURE_OWNERS });
	const gestureCompositionOwner = useSharedValue<GestureCompositionOwner>(null);
	const panGesture = useBuildPanGesture({
		onDismissRequest,
		scrollState,
		screenOptions,
		gestureConfig,
		gestureOwners,
		gestureCompositionOwner,
	});
	const pinchGesture = useBuildPinchGesture({
		onDismissRequest,
		screenOptions,
		gestureConfig,
		gestureCompositionOwner,
	});
	const detectorGesture = useMemo(
		() => Gesture.Simultaneous(panGesture, pinchGesture),
		[panGesture, pinchGesture],
	);
	const claimedDirections = gestureConfig.participation.claimedDirections;
	return useMemo(
		() => ({
			routeKey: currentScreenKey,
			detectorGesture,
			panGesture,
			pinchGesture,
			scrollState,
			owners: gestureOwners,
			claimedDirections,
		}),
		[
			currentScreenKey,
			detectorGesture,
			panGesture,
			pinchGesture,
			scrollState,
			gestureOwners,
			claimedDirections,
		],
	);
}
