import { useMemo } from "react";
import { computeClaimedDirections } from "../../../utils/gesture/compute-claimed-directions";
import { resolveOwnership } from "../../../utils/gesture/resolve-ownership";
import { validateSnapPoints } from "../../../utils/gesture/validate-snap-points";
import {
	useDescriptorDerivations,
	useDescriptors,
} from "../../screen/descriptors";
import type { GestureContextType, ScreenGestureConfig } from "../types";

interface UseScreenGestureConfigProps {
	ancestorContext: GestureContextType | null;
}

export function useScreenGestureConfig({
	ancestorContext,
}: UseScreenGestureConfigProps): ScreenGestureConfig {
	const {
		current: {
			options: { gestureEnabled, gestureDirection, snapPoints },
		},
	} = useDescriptors();

	const { isFirstKey, currentScreenKey } = useDescriptorDerivations();

	return useMemo(() => {
		// No need for the first screen to have a gesture enabled
		const canDismiss = Boolean(isFirstKey ? false : gestureEnabled);

		const effectiveSnapPoints = validateSnapPoints({
			snapPoints,
			canDismiss,
		});

		const nextGestureEnabled = canDismiss || effectiveSnapPoints.hasSnapPoints;

		const claimedDirections = computeClaimedDirections(
			nextGestureEnabled,
			gestureDirection,
			effectiveSnapPoints.hasSnapPoints,
		);

		return {
			routeKey: currentScreenKey,
			canDismiss,
			gestureEnabled: nextGestureEnabled,
			effectiveSnapPoints,
			claimedDirections,
			ownershipStatus: resolveOwnership(claimedDirections, ancestorContext),
		};
	}, [
		currentScreenKey,
		isFirstKey,
		gestureEnabled,
		gestureDirection,
		snapPoints,
		ancestorContext,
	]);
}
