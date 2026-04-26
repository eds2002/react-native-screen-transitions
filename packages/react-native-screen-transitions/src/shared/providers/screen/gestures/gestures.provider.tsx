import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { StackType } from "../../../types/stack.types";
import createProvider from "../../../utils/create-provider";
import { useStackCoreContext } from "../../stack/core.provider";
import { useBuildPanGesture } from "./builders/use-build-pan-gesture";
import { useBuildPinchGesture } from "./builders/use-build-pinch-gesture";
import { useScreenGestureConfig } from "./config/use-screen-gesture-config";
import { useGestureRuntimeOverrides } from "./hooks/use-gesture-runtime-overrides";
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
	const { flags } = useStackCoreContext();
	const config = useScreenGestureConfig();
	const isIsolated = flags.STACK_TYPE === StackType.COMPONENT;

	const scrollState = useSharedValue<ScrollGestureState | null>(null);

	// Ancestors read this before activating. If a nested screen claims the same
	// direction, it writes here so the ancestor can fail and let it take priority.
	const childDirectionClaims = useSharedValue<DirectionClaimMap>(NO_CLAIMS);

	const runtimeOverrides = useGestureRuntimeOverrides();

	const { ancestorPanGesturesToBlock } = useWalkUpAndRegisterShadowingClaims(
		config.claimedDirections,
		isIsolated,
	);

	const { panGesture, panGestureRef } = useBuildPanGesture({
		scrollState,
		config,
		childDirectionClaims,
		runtimeOverrides,
		ancestorPanGesturesToBlock,
	});

	const pinchGesture = useBuildPinchGesture({
		config,
		runtimeOverrides,
	});

	const detectorGesture = useMemo(
		() => Gesture.Race(panGesture, pinchGesture),
		[panGesture, pinchGesture],
	);

	const value = useMemo<GestureContextType>(
		() => ({
			detectorGesture,
			panGesture,
			panGestureRef,
			pinchGesture,
			scrollState,
			runtimeOverrides,
			gestureContext,
			gestureEnabled: config.gestureEnabled,
			isIsolated,
			claimedDirections: config.claimedDirections,
			childDirectionClaims,
		}),
		[
			detectorGesture,
			panGesture,
			panGestureRef,
			pinchGesture,
			scrollState,
			runtimeOverrides,
			gestureContext,
			config.gestureEnabled,
			isIsolated,
			config.claimedDirections,
			childDirectionClaims,
		],
	);

	return {
		value,
		children,
	};
});
