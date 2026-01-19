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

/** Returns pan gestures of ancestors whose directions we shadow (claim the same direction). */
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

/**
 * Builds Pan and Native Gestures for Screen Dismissal
 *
 * ## Mental Model
 *
 * This hook creates the gesture configuration for a screen. The key insight is that
 * gesture coordination happens at TWO levels:
 *
 * 1. **Native Gesture Handler Level** (blocksExternalGesture, requireExternalGestureToFail)
 *    - Prevents simultaneous gesture recognition
 *    - Sets up which gestures must fail before others can activate
 *
 * 2. **JS/Worklet Level** (ownership checks in use-screen-gesture-handlers)
 *    - Determines which screen "owns" each direction
 *    - Handles ScrollView boundary checks
 *    - Manages child direction claims
 *
 * ## Shadowing
 *
 * When a child claims the same direction as an ancestor, we call it "shadowing".
 * The child's gesture takes priority:
 *
 * ```
 * Parent (claims vertical)
 *   └── Child (claims vertical)  ← shadows parent
 *
 * Result: Child handles all vertical gestures, parent is blocked
 * ```
 *
 * This hook detects shadowing by walking up the ancestor chain and adds
 * `blocksExternalGesture()` to prevent the ancestor's pan from activating.
 *
 * ## Native Gesture Setup
 *
 * - **Screen claims directions**: Native gesture waits for our pan to fail first
 * - **Screen claims nothing**: Native gesture waits for nearest ancestor's pan that claims directions
 * - **No one claims anything**: Plain native gesture (no coordination needed)
 */
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

	const panGestureRef = useRef<GestureType | undefined>(undefined);

	const gestureAnimationValues = GestureStore.getRouteGestures(
		current.route.key,
	);

	const { snapPoints } = current.options;

	const canDismiss = Boolean(
		isFirstScreen ? false : current.options.gestureEnabled,
	);

	// Snap navigation enabled even when gestureEnabled=false (matches iOS native sheets)
	const hasSnapPoints = Array.isArray(snapPoints) && snapPoints.length > 0;
	const gestureEnabled = canDismiss || hasSnapPoints;

	const ownershipStatus = useMemo(
		() => resolveOwnership(claimedDirections, ancestorContext ?? null),
		[claimedDirections, ancestorContext],
	);

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

		let nativeGesture: GestureType;

		if (selfClaimsAny) {
			// Screen claims directions: native waits for pan, pan blocks native
			nativeGesture = Gesture.Native().requireExternalGestureToFail(panGesture);
			panGesture.blocksExternalGesture(nativeGesture);

			// Block shadowed ancestor pan gestures
			const shadowedAncestorGestures = findShadowedAncestorPanGestures(
				claimedDirections,
				ancestorContext,
			);
			for (const ancestorPan of shadowedAncestorGestures) {
				panGesture.blocksExternalGesture(ancestorPan);
			}
		} else {
			// Screen claims nothing: find nearest ancestor with claims
			let activePanAncestor = ancestorContext;
			while (
				activePanAncestor &&
				!claimsAnyDirection(activePanAncestor.claimedDirections)
			) {
				activePanAncestor = activePanAncestor.ancestorContext;
			}

			if (activePanAncestor?.panGesture) {
				nativeGesture = Gesture.Native().requireExternalGestureToFail(
					activePanAncestor.panGesture,
				);
			} else {
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
