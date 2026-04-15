/**
 * Gesture System - Core Provider
 *
 * Each screen gets a GestureContext containing:
 * - panGesture: Pan gesture handler for dismiss/snap
 * - scrollState: Scroll coordination state for boundary detection
 * - claimedDirections: Which directions this screen handles
 * - childDirectionClaims: Claims registered by descendant screens
 *
 * ScrollView coordination is handled by useScrollGestureCoordination, which
 * finds the gesture owner for the scroll axis and creates appropriate Native
 * gestures.
 */

import { useMemo } from "react";
import { useSimultaneousGestures } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import createProvider from "../../../utils/create-provider";
import { useBuildPanGesture } from "./builders/use-build-pan-gesture";
import { useBuildPinchGesture } from "./builders/use-build-pinch-gesture";
import { useScreenGestureConfig } from "./config/use-screen-gesture-config";
import { useRegisterDirectionClaims } from "./ownership/use-register-direction-claims";
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
	const config = useScreenGestureConfig();

	const scrollState = useSharedValue<ScrollGestureState | null>(null);
	const childDirectionClaims = useSharedValue<DirectionClaimMap>(NO_CLAIMS);

	const panGesture = useBuildPanGesture({
		scrollState,
		config,
		childDirectionClaims,
	});

	const pinchGesture = useBuildPinchGesture({
		config,
	});

	const detectorGesture = useSimultaneousGestures(
		...(pinchGesture ? [panGesture, pinchGesture] : [panGesture]),
	);

	const value = useMemo<GestureContextType>(
		() => ({
			detectorGesture,
			panGesture,
			pinchGesture,
			scrollState,
			gestureContext,
			gestureEnabled: config.gestureEnabled,
			claimedDirections: config.claimedDirections,
			childDirectionClaims,
		}),
		[
			detectorGesture,
			panGesture,
			pinchGesture,
			scrollState,
			gestureContext,
			config.gestureEnabled,
			config.claimedDirections,
			childDirectionClaims,
		],
	);

	useRegisterDirectionClaims(config.claimedDirections);

	return {
		value,
		children,
	};
});
