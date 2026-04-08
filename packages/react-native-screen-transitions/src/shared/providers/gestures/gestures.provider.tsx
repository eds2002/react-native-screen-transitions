/**
 * Gesture System - Core Provider
 *
 * Each screen gets a GestureContext containing:
 * - panGesture: Pan gesture handler for dismiss/snap
 * - scrollConfig: Scroll state for boundary detection
 * - claimedDirections: Which directions this screen handles
 * - childDirectionClaims: Claims registered by descendant screens
 *
 * ScrollView coordination is handled by useScrollRegistry, which finds the
 * gesture owner for the scroll axis and creates appropriate Native gestures.
 */

import { useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";
import createProvider from "../../utils/create-provider";
import {
	useDescriptorDerivations,
	useDescriptors,
} from "../screen/descriptors";
import { useBuildPanGesture } from "./builders/use-build-pan-gesture";
import { useScreenGestureConfig } from "./config/use-screen-gesture-config";
import { useRegisterDirectionClaims } from "./ownership/use-register-direction-claims";
import {
	type DirectionClaimMap,
	type GestureContextType,
	NO_CLAIMS,
	type ScrollConfig,
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
	const ancestorContext: GestureContextType | null = useGestureContext();

	const config = useScreenGestureConfig({
		ancestorContext,
	});

	const scrollConfig = useSharedValue<ScrollConfig | null>(null);
	const childDirectionClaims = useSharedValue<DirectionClaimMap>(NO_CLAIMS);

	const { panGesture, panGestureRef } = useBuildPanGesture({
		scrollConfig,
		ancestorContext,
		config,
		childDirectionClaims,
	});

	const value = useMemo<GestureContextType>(
		() => ({
			panGesture,
			panGestureRef,
			scrollConfig,
			ancestorContext,
			gestureEnabled: config.gestureEnabled,
			isIsolated: false,
			claimedDirections: config.claimedDirections,
			childDirectionClaims,
		}),
		[
			panGesture,
			panGestureRef,
			scrollConfig,
			ancestorContext,
			config.gestureEnabled,
			config.claimedDirections,
			childDirectionClaims,
		],
	);

	useRegisterDirectionClaims(ancestorContext, config.claimedDirections);

	return {
		value,
		children,
	};
});
