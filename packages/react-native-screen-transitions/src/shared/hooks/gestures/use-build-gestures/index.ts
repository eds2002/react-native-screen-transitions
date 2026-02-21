import { StackActions } from "@react-navigation/native";
import { useCallback, useMemo, useRef } from "react";
import { Gesture, type GestureType } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type {
	DirectionClaimMap,
	GestureContextType,
	ScrollConfig,
} from "../../../providers/gestures.provider";
import { useKeys } from "../../../providers/screen/keys.provider";
import {
	GestureStore,
	type GestureStoreMap,
} from "../../../stores/gesture.store";
import {
	type ClaimedDirections,
	DIRECTIONS,
} from "../../../types/ownership.types";
import { claimsAnyDirection } from "../../../utils/gesture/compute-claimed-directions";
import { resolveOwnership } from "../../../utils/gesture/resolve-ownership";
import { validateSnapPoints } from "../../../utils/gesture/validate-snap-points";
import { useHandlers } from "./handlers/use-handlers";

/**
 * Finds ancestor pan gestures that we shadow (claim the same direction).
 * Used to block ancestors when child claims priority.
 */
function findShadowedAncestorPanGestures(
	selfClaims: ClaimedDirections,
	ancestorContext: GestureContextType | null | undefined,
	isIsolated: boolean,
): GestureType[] {
	const shadowedGestures: GestureType[] = [];
	let ancestor = ancestorContext;

	while (ancestor) {
		if (ancestor.isIsolated !== isIsolated) break;

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
	isIsolated: boolean;
}

/**
 * Builds the Pan gesture for screen dismissal.
 *
 * Handles shadowing: when child claims same direction as ancestor,
 * child's pan blocks ancestor's pan via `blocksExternalGesture()`.
 *
 * ScrollView coordination is handled separately by useScrollRegistry,
 * which creates its own Native gesture per ScrollView.
 */
export const useBuildGestures = ({
	scrollConfig,
	ancestorContext,
	claimedDirections,
	childDirectionClaims,
	isIsolated,
}: BuildGesturesHookProps): {
	panGesture: GestureType;
	panGestureRef: React.MutableRefObject<GestureType | undefined>;
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

	const { snapPoints: rawSnapPoints } = current.options;
	const canDismiss = Boolean(
		isFirstScreen ? false : current.options.gestureEnabled,
	);
	const validatedSnapPoints = useMemo(
		() => validateSnapPoints({ snapPoints: rawSnapPoints, canDismiss }),
		[rawSnapPoints, canDismiss],
	);
	const gestureEnabled = canDismiss || validatedSnapPoints.hasSnapPoints;

	const ownershipStatus = useMemo(
		() => resolveOwnership(claimedDirections, ancestorContext ?? null),
		[claimedDirections, ancestorContext],
	);

	const selfClaimsAny = claimsAnyDirection(claimedDirections);

	const handleDismiss = useCallback(() => {
		if (ancestorContext?.gestureAnimationValues.isDismissing?.value) return;

		const state = current.navigation.getState();
		const routeStillPresent = state.routes.some(
			(route) => route.key === current.route.key,
		);
		if (!routeStillPresent) return;

		current.navigation.dispatch({
			...StackActions.pop(),
			source: current.route.key,
			target: state.key,
		});
	}, [current, ancestorContext]);

	const { onTouchesDown, onTouchesMove, onStart, onUpdate, onEnd } =
		useHandlers({
			scrollConfig,
			canDismiss,
			handleDismiss,
			ownershipStatus,
			ancestorIsDismissing:
				ancestorContext?.gestureAnimationValues.isDismissing,
			claimedDirections,
			ancestorContext,
			childDirectionClaims,
			validatedSnapPoints,
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

		// Block shadowed ancestor pan gestures when we claim same directions
		if (selfClaimsAny) {
			const shadowedAncestorGestures = findShadowedAncestorPanGestures(
				claimedDirections,
				ancestorContext,
				isIsolated,
			);
			for (const ancestorPan of shadowedAncestorGestures) {
				panGesture.blocksExternalGesture(ancestorPan);
			}
		}

		return {
			panGesture,
			panGestureRef,
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
		isIsolated,
	]);
};
