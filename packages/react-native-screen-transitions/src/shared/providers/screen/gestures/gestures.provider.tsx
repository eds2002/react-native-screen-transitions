import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { ScrollStore } from "../../../stores/scroll.store";
import createProvider from "../../../utils/create-provider";
import { useDescriptorDerivations } from "../descriptors";
import { useScreenGestureConfig } from "./hooks/use-screen-gesture-config";
import { useWalkUpAndRegisterShadowingClaims } from "./ownership/use-walk-up-and-register-shadowing-claims";
import { useBuildPanGesture } from "./pan/build-pan-gesture";
import { useBuildPinchGesture } from "./pinch/build-pinch-gesture";
import {
	type DirectionClaimMap,
	type GestureContextType,
	NO_DIRECTION_CLAIMS,
} from "./types";

interface ScreenGestureProviderProps {
	children: React.ReactNode;
}

export const {
	ScreenGestureProvider,
	useScreenGestureContext: useGestureContext,
} = createProvider("ScreenGesture", { guarded: false })<
	ScreenGestureProviderProps,
	GestureContextType
>(({ children }): { value: GestureContextType; children: React.ReactNode } => {
	const gestureContext = useGestureContext();
	const gestureConfig = useScreenGestureConfig();
	const { currentScreenKey } = useDescriptorDerivations();

	const scrollState = ScrollStore.getValue(currentScreenKey, "state");

	// Ancestors read this before activating. If a nested screen claims the same
	// direction, it writes here so the ancestor can fail and let it take priority.
	const childDirectionClaims =
		useSharedValue<DirectionClaimMap>(NO_DIRECTION_CLAIMS);

	const panGesture = useBuildPanGesture({
		scrollState,
		gestureConfig,
		childDirectionClaims,
	});

	const pinchGesture = useBuildPinchGesture({
		gestureConfig,
	});

	const detectorGesture = useMemo(
		() => Gesture.Race(panGesture, pinchGesture),
		[panGesture, pinchGesture],
	);

	const value = useMemo<GestureContextType>(
		() => ({
			routeKey: currentScreenKey,
			detectorGesture,
			panGesture,
			pinchGesture,
			scrollState,
			gestureContext,
			claimedDirections: gestureConfig.participation.claimedDirections,
			childDirectionClaims,
		}),
		[
			currentScreenKey,
			detectorGesture,
			panGesture,
			pinchGesture,
			scrollState,
			gestureContext,
			gestureConfig.participation.claimedDirections,
			childDirectionClaims,
		],
	);

	useWalkUpAndRegisterShadowingClaims(
		gestureConfig.participation.claimedDirections,
	);

	return {
		value,
		children,
	};
});
