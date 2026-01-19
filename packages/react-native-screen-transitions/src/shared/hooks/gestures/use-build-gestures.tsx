import { StackActions } from "@react-navigation/native";
import { useCallback, useMemo, useRef } from "react";
import { Gesture, type GestureType } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type {
	DirectionClaimMap,
	GestureContextType,
	ScrollConfig,
} from "../../providers/gestures.provider";
import { useKeys } from "../../providers/screen/keys.provider";
import { GestureStore, type GestureStoreMap } from "../../stores/gesture.store";
import type { ClaimedDirections, Direction } from "../../types/ownership.types";
import { claimsAnyDirection } from "../../utils/gesture/compute-claimed-directions";
import { resolveOwnership } from "../../utils/gesture/resolve-ownership";
import { useScreenGestureHandlers } from "./use-screen-gesture-handlers";

const DIRECTIONS: Direction[] = [
	"vertical",
	"vertical-inverted",
	"horizontal",
	"horizontal-inverted",
];

/**
 * Check if this screen shadows any direction claimed by an ancestor.
 * Shadowing means both this screen and an ancestor claim the same direction.
 */
function findShadowedAncestorPanGestures(
	selfClaims: ClaimedDirections,
	ancestorContext: GestureContextType | null | undefined,
): GestureType[] {
	const shadowedGestures: GestureType[] = [];

	let ancestor = ancestorContext;
	while (ancestor) {
		// Check if we shadow any direction this ancestor claims
		const shadowsAncestor = DIRECTIONS.some(
			(dir) => selfClaims[dir] && ancestor?.claimedDirections?.[dir],
		);

		if (shadowsAncestor && ancestor.panGesture) {
			shadowedGestures.push(ancestor.panGesture);
		}

		ancestor = ancestor.ancestorContext;
	}

	return shadowedGestures;
}

interface BuildGesturesHookProps {
	scrollConfig: SharedValue<ScrollConfig | null>;
	ancestorContext?: GestureContextType | null;
	claimedDirections: ClaimedDirections;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
}

export const useBuildGestures = ({
	scrollConfig,
	ancestorContext,
	claimedDirections,
	childDirectionClaims,
}: BuildGesturesHookProps): {
	panGesture: GestureType;
	panGestureRef: React.MutableRefObject<GestureType | undefined>;
	nativeGesture: GestureType;
	gestureAnimationValues: GestureStoreMap;
} => {
	const { current } = useKeys();

	const navState = current.navigation.getState();

	const isFirstScreen = useMemo(() => {
		return navState.routes.findIndex((r) => r.key === current.route.key) === 0;
	}, [navState.routes, current.route.key]);

	// Ref for external gesture coordination (e.g., swipeable lists)
	const panGestureRef = useRef<GestureType | undefined>(undefined);

	const gestureAnimationValues = GestureStore.getRouteGestures(
		current.route.key,
	);

	const { snapPoints } = current.options;

	// Dismiss gesture is controlled by gestureEnabled (disabled for first screen)
	const canDismiss = Boolean(
		isFirstScreen ? false : current.options.gestureEnabled,
	);

	// Snap navigation works independently - enabled when snap points exist
	// This matches iOS native sheet behavior where gestureEnabled: false
	// disables dismiss but you can still drag between detents
	const hasSnapPoints = Array.isArray(snapPoints) && snapPoints.length > 0;
	const gestureEnabled = canDismiss || hasSnapPoints;

	// Compute ownership status for all directions
	// This determines whether this screen owns each direction or should bubble up
	const ownershipStatus = useMemo(
		() => resolveOwnership(claimedDirections, ancestorContext ?? null),
		[claimedDirections, ancestorContext],
	);

	// Check if this screen claims any direction (for native gesture setup)
	const selfClaimsAny = claimsAnyDirection(claimedDirections);

	const handleDismiss = useCallback(() => {
		// If an ancestor navigator is already dismissing, skip this dismiss to
		// avoid racing with the ancestor
		if (ancestorContext?.gestureAnimationValues.isDismissing?.value) {
			return;
		}

		const state = current.navigation.getState();

		const routeStillPresent = state.routes.some(
			(route) => route.key === current.route.key,
		);

		if (!routeStillPresent) {
			return;
		}

		current.navigation.dispatch({
			...StackActions.pop(),
			source: current.route.key,
			target: state.key,
		});
	}, [current, ancestorContext]);

	const { onTouchesDown, onTouchesMove, onStart, onUpdate, onEnd } =
		useScreenGestureHandlers({
			scrollConfig,
			canDismiss,
			handleDismiss,
			ownershipStatus,
			ancestorIsDismissing:
				ancestorContext?.gestureAnimationValues.isDismissing,
			claimedDirections,
			ancestorContext,
			childDirectionClaims,
		});

	return useMemo(() => {
		const panGesture = Gesture.Pan()
			.withRef(panGestureRef)
			.enabled(gestureEnabled)
			.manualActivation(true)
			.onTouchesDown(onTouchesDown)
			.onTouchesMove(onTouchesMove)
			.onStart(onStart)
			.onUpdate(onUpdate)
			.onEnd(onEnd);

		// Native gesture setup depends on whether this screen or ancestors claim directions
		let nativeGesture: GestureType;

		if (selfClaimsAny) {
			// This screen claims directions - set up normal pan/native relationship
			nativeGesture = Gesture.Native().requireExternalGestureToFail(panGesture);
			panGesture.blocksExternalGesture(nativeGesture);

			// If this screen shadows any ancestor's direction, block their pan gestures.
			// This ensures the child's gesture takes priority when both claim the same direction.
			const shadowedAncestorGestures = findShadowedAncestorPanGestures(
				claimedDirections,
				ancestorContext,
			);
			for (const ancestorPan of shadowedAncestorGestures) {
				panGesture.blocksExternalGesture(ancestorPan);
			}
		} else {
			// This screen claims nothing
			// Find nearest ancestor that claims any direction
			let activePanAncestor = ancestorContext;
			while (
				activePanAncestor &&
				!claimsAnyDirection(activePanAncestor.claimedDirections)
			) {
				activePanAncestor = activePanAncestor.ancestorContext;
			}

			if (activePanAncestor?.panGesture) {
				// Found an ancestor that claims directions - wait for its pan
				nativeGesture = Gesture.Native().requireExternalGestureToFail(
					activePanAncestor.panGesture,
				);
			} else {
				// No ancestor claims any direction - plain native
				nativeGesture = Gesture.Native();
			}
		}

		return {
			panGesture,
			panGestureRef,
			nativeGesture,
			gestureAnimationValues,
		};
	}, [
		gestureEnabled,
		selfClaimsAny,
		claimedDirections,
		onTouchesDown,
		onTouchesMove,
		onStart,
		onUpdate,
		onEnd,
		gestureAnimationValues,
		ancestorContext,
	]);
};
