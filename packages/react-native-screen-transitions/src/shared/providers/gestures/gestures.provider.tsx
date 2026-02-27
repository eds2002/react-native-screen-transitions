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
import { useNavigationHelpers } from "../../hooks/navigation/use-navigation-helpers";
import { StackType } from "../../types/stack.types";
import createProvider from "../../utils/create-provider";
import { computeClaimedDirections } from "../../utils/gesture/compute-claimed-directions";
import { validateSnapPoints } from "../../utils/gesture/validate-snap-points";
import { useKeys } from "../screen/keys";
import { useStackCoreContext } from "../stack/core.provider";
import { useRegisterDirectionClaims } from "./helpers/register-direction-claims";
import {
	type DirectionClaimMap,
	type GestureContextType,
	NO_CLAIMS,
	type ScrollConfig,
} from "./types";
import { useBuildGestures } from "./use-build-gestures";

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
	const { current } = useKeys();
	const { isFirstKey, isTopMostScreen } = useNavigationHelpers();
	const { flags } = useStackCoreContext();

	const ancestorContext: GestureContextType | null = useGestureContext();
	const isIsolated = flags.STACK_TYPE === StackType.COMPONENT;
	const routeKey = current.route.key;

	const canDismiss = Boolean(
		isFirstKey ? false : current.options.gestureEnabled,
	);

	const { hasSnapPoints } = useMemo(
		() =>
			validateSnapPoints({
				snapPoints: current.options.snapPoints,
				canDismiss,
			}),
		[current.options.snapPoints, canDismiss],
	);

	const gestureEnabled = canDismiss || hasSnapPoints;

	const claimedDirections = useMemo(
		() =>
			computeClaimedDirections(
				gestureEnabled,
				current.options.gestureDirection,
				hasSnapPoints,
			),
		[gestureEnabled, current.options.gestureDirection, hasSnapPoints],
	);

	const scrollConfig = useSharedValue<ScrollConfig | null>(null);
	const childDirectionClaims = useSharedValue<DirectionClaimMap>(NO_CLAIMS);

	useRegisterDirectionClaims(
		ancestorContext,
		claimedDirections,
		routeKey,
		isIsolated,
		isTopMostScreen,
	);

	const { panGesture, panGestureRef, gestureAnimationValues } =
		useBuildGestures({
			scrollConfig,
			ancestorContext,
			claimedDirections,
			childDirectionClaims,
			isIsolated,
		});

	const value = useMemo<GestureContextType>(
		() => ({
			panGesture,
			panGestureRef,
			scrollConfig,
			gestureAnimationValues,
			ancestorContext,
			gestureEnabled,
			isIsolated,
			claimedDirections,
			childDirectionClaims,
		}),
		[
			panGesture,
			panGestureRef,
			scrollConfig,
			gestureAnimationValues,
			ancestorContext,
			gestureEnabled,
			isIsolated,
			claimedDirections,
			childDirectionClaims,
		],
	);

	return {
		value,
		children,
	};
});
