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

import { useNavigationState } from "@react-navigation/native";
import { useEffect, useMemo } from "react";
import type { GestureType } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { useBuildGestures } from "../hooks/gestures/use-build-gestures";
import { GestureStore, type GestureStoreMap } from "../stores/gesture.store";
import {
	type ClaimedDirections,
	DIRECTIONS,
	type Direction,
} from "../types/ownership.types";
import { StackType } from "../types/stack.types";
import createProvider from "../utils/create-provider";
import { computeClaimedDirections } from "../utils/gesture/compute-claimed-directions";
import { validateSnapPoints } from "../utils/gesture/validate-snap-points";
import { useKeys } from "./screen/keys.provider";
import { useStackCoreContext } from "./stack/core.provider";

export type ScrollConfig = {
	x: number;
	y: number;
	contentHeight: number;
	contentWidth: number;
	layoutHeight: number;
	layoutWidth: number;
	isTouched: boolean;
};

export type DirectionClaim = {
	routeKey: string;
	isDismissing: SharedValue<number>;
} | null;

export type DirectionClaimMap = {
	vertical: DirectionClaim;
	"vertical-inverted": DirectionClaim;
	horizontal: DirectionClaim;
	"horizontal-inverted": DirectionClaim;
};

const NO_CLAIMS: DirectionClaimMap = {
	vertical: null,
	"vertical-inverted": null,
	horizontal: null,
	"horizontal-inverted": null,
};

/**
 * Registers direction claims on ancestors that this screen shadows.
 * Only registers claims when this screen is the current (topmost) route
 * in its navigator, preventing unfocused screens from blocking gestures.
 */
function useRegisterDirectionClaims(
	ancestorContext: GestureContextType | null | undefined,
	claimedDirections: ClaimedDirections,
	routeKey: string,
	isIsolated: boolean,
	isCurrentRoute: boolean,
) {
	useEffect(() => {
		// Only register claims when this screen is the current route
		if (!isCurrentRoute || !ancestorContext) {
			return;
		}

		const gestureValues = GestureStore.getRouteGestures(routeKey);
		const isDismissing = gestureValues.isDismissing;

		const claimedAncestors: Array<{
			ancestor: GestureContextType;
			directions: Direction[];
		}> = [];

		let ancestor: GestureContextType | null = ancestorContext;
		while (ancestor) {
			if (ancestor.isIsolated !== isIsolated) break;

			const shadowedDirections: Direction[] = [];
			for (const dir of DIRECTIONS) {
				if (claimedDirections[dir] && ancestor.claimedDirections?.[dir]) {
					shadowedDirections.push(dir);
				}
			}

			if (shadowedDirections.length > 0) {
				claimedAncestors.push({ ancestor, directions: shadowedDirections });
				const newClaims = { ...ancestor.childDirectionClaims.value };
				for (const dir of shadowedDirections) {
					newClaims[dir] = { routeKey, isDismissing };
				}
				ancestor.childDirectionClaims.value = newClaims;
			}

			ancestor = ancestor.ancestorContext;
		}

		return () => {
			for (const { ancestor, directions } of claimedAncestors) {
				const currentClaims = ancestor.childDirectionClaims.value;
				const newClaims = { ...currentClaims };
				let needsUpdate = false;

				for (const dir of directions) {
					if (currentClaims[dir]?.routeKey === routeKey) {
						newClaims[dir] = null;
						needsUpdate = true;
					}
				}

				if (needsUpdate) {
					ancestor.childDirectionClaims.value = newClaims;
				}
			}
		};
	}, [
		ancestorContext,
		claimedDirections,
		routeKey,
		isIsolated,
		isCurrentRoute,
	]);
}

export interface GestureContextType {
	panGesture: GestureType;
	panGestureRef: React.MutableRefObject<GestureType | undefined>;
	scrollConfig: SharedValue<ScrollConfig | null>;
	gestureAnimationValues: GestureStoreMap;
	ancestorContext: GestureContextType | null;
	gestureEnabled: boolean;
	isIsolated: boolean;
	claimedDirections: ClaimedDirections;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
}

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
	const { flags } = useStackCoreContext();
	const ancestorContext: GestureContextType | null = useGestureContext();
	const isIsolated = flags.STACK_TYPE === StackType.COMPONENT;
	const routeKey = current.route.key;

	const isFirstScreen = useNavigationState((state) => {
		const index = state.routes.findIndex((route) => route.key === routeKey);
		return index === 0;
	});

	const canDismiss = Boolean(
		isFirstScreen ? false : current.options.gestureEnabled,
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

	// Check if this screen is the current (topmost) route in its navigator
	const isCurrentRoute = useNavigationState(
		(state) => state.routes[state.index]?.key === routeKey,
	);

	const scrollConfig = useSharedValue<ScrollConfig | null>(null);
	const childDirectionClaims = useSharedValue<DirectionClaimMap>(NO_CLAIMS);

	useRegisterDirectionClaims(
		ancestorContext,
		claimedDirections,
		routeKey,
		isIsolated,
		isCurrentRoute,
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
