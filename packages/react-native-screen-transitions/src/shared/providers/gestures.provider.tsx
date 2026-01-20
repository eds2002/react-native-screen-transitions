/**
 * Gesture System - Core Provider
 *
 * ## Overview
 *
 * This provider is the heart of the gesture ownership system. Each screen gets its own
 * GestureContext that contains:
 * - Pan gesture handler for dismiss/snap navigation
 * - Native gesture for ScrollView coordination
 * - Scroll state tracking (via scrollConfig)
 * - Ownership metadata (claimedDirections, childDirectionClaims)
 *
 * ## The Ownership Model
 *
 * Gestures are resolved using a tree-based ownership model:
 *
 * ```
 * 1. DIRECTION INDEPENDENCE: 4 independent directions (vertical, vertical-inverted,
 *    horizontal, horizontal-inverted). Vertical never interferes with horizontal.
 *
 * 2. CLAIMING: A screen "claims" directions via gestureDirection config.
 *    Snap sheets claim BOTH directions on their axis (expand + collapse).
 *
 * 3. SHADOWING: When child claims same direction as ancestor, child wins.
 *    Child "shadows" the ancestor - ancestor is blocked for that direction.
 *
 * 4. INHERITANCE: If screen doesn't claim a direction, ownership walks up
 *    the tree to find an ancestor that does.
 * ```
 *
 * ## Race Condition Prevention
 *
 * The tricky part is that gestures run on the UI thread in parallel. When parent and
 * child both claim the same direction:
 *
 * ```
 * Problem: Both handlers see ownership="self" and might both try to activate
 * Solution: Children pre-register claims on ancestors at MOUNT time (not gesture time)
 * ```
 *
 * This is done via `childDirectionClaims` - a SharedValue on each context that children
 * write to when they mount. The parent checks this before activating.
 *
 * ## Data Flow
 *
 * ```
 * Mount:
 *   1. Compute claimedDirections from screen options
 *   2. Register claims on ancestors (useEffect - see note below)
 *   3. Build pan/native gestures with ownership info
 *
 * Gesture:
 *   1. onTouchesMove detects swipe direction
 *   2. Check ownership (do we own this direction?)
 *   3. Check childDirectionClaims (has a child claimed it?)
 *   4. Check ScrollView boundary (if applicable)
 *   5. Activate or fail
 * ```
 *
 * @see use-build-gestures.tsx - Gesture construction and native coordination
 * @see use-screen-gesture-handlers.ts - Touch handling and activation logic
 * @see use-scroll-registry.tsx - ScrollView state tracking
 */

import { useEffect, useMemo } from "react";
import type { GestureType } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { useBuildGestures } from "../hooks/gestures/use-build-gestures";
import { GestureStore, type GestureStoreMap } from "../stores/gesture.store";
import type { ClaimedDirections, Direction } from "../types/ownership.types";
import { StackType } from "../types/stack.types";
import createProvider from "../utils/create-provider";
import { computeClaimedDirections } from "../utils/gesture/compute-claimed-directions";
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

/**
 * A claim registered by a child that shadows this screen's direction.
 * Includes isDismissing ref so parent can ignore claims from dismissing children.
 */
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

const DIRECTIONS: Direction[] = [
	"vertical",
	"vertical-inverted",
	"horizontal",
	"horizontal-inverted",
];

/**
 * Registers this screen's direction claims on ancestors that it shadows.
 * Cleans up claims on unmount.
 *
 * IMPORTANT: Does not cross isolation boundaries. Isolated stacks (component stacks)
 * are self-contained and do not participate in the gesture system of their parent stacks.
 */
function useRegisterDirectionClaims(
	ancestorContext: GestureContextType | null | undefined,
	claimedDirections: ClaimedDirections,
	routeKey: string,
	isIsolated: boolean,
) {
	useEffect(() => {
		if (!ancestorContext) return;

		// Get our isDismissing ref to include in claims
		const gestureValues = GestureStore.getRouteGestures(routeKey);
		const isDismissing = gestureValues.isDismissing;

		const claimedAncestors: Array<{
			ancestor: GestureContextType;
			directions: Direction[];
		}> = [];

		// Walk up tree, find ancestors we shadow, register claims
		// Stop at isolation boundaries (don't cross between isolated and non-isolated stacks)
		let ancestor: GestureContextType | null = ancestorContext;
		while (ancestor) {
			// Stop if we cross an isolation boundary
			if (ancestor.isIsolated !== isIsolated) {
				break;
			}

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

		// Cleanup: clear claims on unmount (only if we're still the claimer)
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
	}, [ancestorContext, claimedDirections, routeKey, isIsolated]);
}

export interface GestureContextType {
	panGesture: GestureType;
	panGestureRef: React.MutableRefObject<GestureType | undefined>;
	nativeGesture: GestureType;
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
>(({ children }) => {
	const { current } = useKeys();
	const { flags } = useStackCoreContext();
	const ancestorContext = useGestureContext();

	const hasGestures = current.options.gestureEnabled === true;
	const isIsolated = flags.STACK_TYPE === StackType.COMPONENT;

	const hasSnapPoints =
		Array.isArray(current.options.snapPoints) &&
		current.options.snapPoints.length > 0;

	const claimedDirections = useMemo(
		() =>
			computeClaimedDirections(
				hasGestures,
				current.options.gestureDirection,
				hasSnapPoints,
			),
		[hasGestures, current.options.gestureDirection, hasSnapPoints],
	);

	/**
	 * ScrollConfig - Each Screen Gets Its Own
	 *
	 * Each screen has its own scrollConfig. The useScrollRegistry hook
	 * dynamically finds the correct gesture owner for a ScrollView's axis
	 * and writes to that owner's scrollConfig.
	 *
	 * This enables axis isolation:
	 *   workout (claims vertical, scrollConfig_W)
	 *     └─ exercise (claims horizontal, scrollConfig_E)
	 *          └─ <VerticalScrollView> → writes to scrollConfig_W (workout owns vertical)
	 *          └─ <HorizontalScrollView> → writes to scrollConfig_E (exercise owns horizontal)
	 */
	const scrollConfig = useSharedValue<ScrollConfig | null>(null);

	const childDirectionClaims = useSharedValue<DirectionClaimMap>({
		...NO_CLAIMS,
	});

	const routeKey = current.route.key;

	// We need to register claims on ancestors BEFORE any gesture can fire, and clean up on unmount.
	// Doing this during render would be a side effect; doing it in the gesture handler causes races.
	useRegisterDirectionClaims(
		ancestorContext,
		claimedDirections,
		routeKey,
		isIsolated,
	);

	const { panGesture, panGestureRef, nativeGesture, gestureAnimationValues } =
		useBuildGestures({
			scrollConfig,
			ancestorContext,
			claimedDirections,
			childDirectionClaims,
			isIsolated,
		});

	const value: GestureContextType = {
		panGesture,
		panGestureRef,
		scrollConfig,
		nativeGesture,
		gestureAnimationValues,
		ancestorContext,
		gestureEnabled: hasGestures,
		isIsolated,
		claimedDirections,
		childDirectionClaims,
	};

	return {
		value,
		children,
	};
});
