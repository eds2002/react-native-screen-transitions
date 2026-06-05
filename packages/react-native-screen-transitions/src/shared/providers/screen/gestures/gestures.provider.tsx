import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { ScrollStore } from "../../../stores/scroll.store";
import createProvider from "../../../utils/create-provider";
import { useDescriptorDerivations } from "../descriptors";
import { useScreenGestureConfig } from "./hooks/use-screen-gesture-config";
import { useWalkUpAndRegisterShadowingClaims } from "./ownership/use-walk-up-and-register-shadowing-claims";
import { useBuildPanGesture } from "./pan/use-build-pan-gesture";
import { useBuildPinchGesture } from "./pinch/use-build-pinch-gesture";
import { useBuildRotationGesture } from "./rotation/use-build-rotation-gesture";
import {
	type DirectionClaimMap,
	type GestureCompositionActivation,
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

	// Pinch gestures should be simultaneous with pan gestures, but pan gestures should not be simultaneous with pinch gestures.
	// Since we're using manual gestures, if pinch tries to become activated while pan is already active,
	// the pinch gesture will be cancelled and the pan gesture will continue to be active.
	const gestureCompositionActivation =
		useSharedValue<GestureCompositionActivation>(null);

	const panGesture = useBuildPanGesture({
		scrollState,
		gestureConfig,
		childDirectionClaims,
		gestureCompositionActivation,
	});

	const pinchGesture = useBuildPinchGesture({
		gestureConfig,
		gestureCompositionActivation,
	});

	const rotationGesture = useBuildRotationGesture({
		gestureConfig,
		gestureCompositionActivation,
	});

	const detectorGesture = useMemo(
		() => Gesture.Simultaneous(panGesture, pinchGesture, rotationGesture),
		[panGesture, pinchGesture, rotationGesture],
	);

	const value = useMemo<GestureContextType>(
		() => ({
			routeKey: currentScreenKey,
			detectorGesture,
			panGesture,
			pinchGesture,
			rotationGesture,
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
			rotationGesture,
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
