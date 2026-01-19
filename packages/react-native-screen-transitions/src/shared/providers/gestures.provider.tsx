import { useEffect, useMemo } from "react";
import type { GestureType } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { useBuildGestures } from "../hooks/gestures/use-build-gestures";
import type { GestureStoreMap } from "../stores/gesture.store";
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
 * Tracks which child route has claimed each direction.
 * Used to coordinate between parent and child gestures when they shadow the same direction.
 * When a child claims a direction, the parent should defer to it.
 */
export type DirectionClaimMap = {
	vertical: string | null;
	"vertical-inverted": string | null;
	horizontal: string | null;
	"horizontal-inverted": string | null;
};

const NO_CLAIMS: DirectionClaimMap = {
	vertical: null,
	"vertical-inverted": null,
	horizontal: null,
	"horizontal-inverted": null,
};

export interface GestureContextType {
	panGesture: GestureType;
	panGestureRef: React.MutableRefObject<GestureType | undefined>;
	nativeGesture: GestureType;
	scrollConfig: SharedValue<ScrollConfig | null>;
	gestureAnimationValues: GestureStoreMap;
	ancestorContext: GestureContextType | null;
	gestureEnabled: boolean;
	isIsolated: boolean;
	/**
	 * The directions this screen claims ownership of.
	 * Used for gesture ownership resolution.
	 */
	claimedDirections: ClaimedDirections;
	/**
	 * Shared value tracking which child route has claimed each direction.
	 * Children set this when they shadow a parent's direction and are about to activate.
	 * Parents check this before activating - if a child has claimed, parent defers.
	 */
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
	const scrollConfig = useSharedValue<ScrollConfig | null>(null);

	const hasGestures = current.options.gestureEnabled === true;
	const isIsolated = flags.STACK_TYPE === StackType.COMPONENT;

	// Compute claimed directions for ownership resolution
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

	// Shared value for children to claim directions when they shadow this screen's directions.
	// Children set claims here, and this screen checks before activating.
	const childDirectionClaims = useSharedValue<DirectionClaimMap>({
		...NO_CLAIMS,
	});

	const routeKey = current.route.key;

	// Pre-register claims on ancestors at mount time.
	// This ensures the claim is in place BEFORE any gesture handling happens,
	// avoiding the race condition where parent activates before child claims.
	useEffect(() => {
		if (!ancestorContext) return;

		const DIRECTIONS: Direction[] = [
			"vertical",
			"vertical-inverted",
			"horizontal",
			"horizontal-inverted",
		];

		// Find all ancestors whose directions we shadow and pre-register claims
		const claimedAncestors: Array<{
			ancestor: GestureContextType;
			directions: Direction[];
		}> = [];

		let ancestor: GestureContextType | null = ancestorContext;
		while (ancestor) {
			const shadowedDirections: Direction[] = [];

			for (const dir of DIRECTIONS) {
				if (claimedDirections[dir] && ancestor.claimedDirections?.[dir]) {
					// We shadow this ancestor's direction - claim it
					shadowedDirections.push(dir);
				}
			}

			if (shadowedDirections.length > 0) {
				claimedAncestors.push({ ancestor, directions: shadowedDirections });

				// Set the claims
				const newClaims = { ...ancestor.childDirectionClaims.value };
				for (const dir of shadowedDirections) {
					newClaims[dir] = routeKey;
				}
				ancestor.childDirectionClaims.value = newClaims;
			}

			ancestor = ancestor.ancestorContext;
		}

		// Cleanup: clear claims when this screen unmounts
		return () => {
			for (const { ancestor, directions } of claimedAncestors) {
				const currentClaims = ancestor.childDirectionClaims.value;
				const newClaims = { ...currentClaims };
				let needsUpdate = false;

				for (const dir of directions) {
					// Only clear if we're still the claimer
					if (currentClaims[dir] === routeKey) {
						newClaims[dir] = null;
						needsUpdate = true;
					}
				}

				if (needsUpdate) {
					ancestor.childDirectionClaims.value = newClaims;
				}
			}
		};
	}, [ancestorContext, claimedDirections, routeKey]);

	const { panGesture, panGestureRef, nativeGesture, gestureAnimationValues } =
		useBuildGestures({
			scrollConfig,
			ancestorContext,
			claimedDirections,
			childDirectionClaims,
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
