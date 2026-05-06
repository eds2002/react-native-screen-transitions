import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import createProvider from "../../../utils/create-provider";
import { useBuildPanGesture } from "./builders/use-build-pan-gesture";
import { useBuildPinchGesture } from "./builders/use-build-pinch-gesture";
import { useScreenGestureConfig } from "./hooks/use-screen-gesture-config";
import { useWalkUpAndRegisterShadowingClaims } from "./ownership/use-walk-up-and-register-shadowing-claims";
import {
	type DirectionClaimMap,
	type GestureContextType,
	NO_CLAIMS,
	type ScrollGestureState,
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

	const scrollState = useSharedValue<ScrollGestureState | null>(null);

	// Ancestors read this before activating. If a nested screen claims the same
	// direction, it writes here so the ancestor can fail and let it take priority.
	const childDirectionClaims = useSharedValue<DirectionClaimMap>(NO_CLAIMS);

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
			detectorGesture,
			panGesture,
			pinchGesture,
			scrollState,
			gestureContext,
			claimedDirections: gestureConfig.participation.claimedDirections,
			childDirectionClaims,
		}),
		[
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
