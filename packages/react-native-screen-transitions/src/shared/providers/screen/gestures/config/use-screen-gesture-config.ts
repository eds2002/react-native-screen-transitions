import { useMemo } from "react";
import {
	useDescriptorDerivations,
	useDescriptors,
} from "../../../screen/descriptors";
import { useGestureContext } from "../gestures.provider";
import { validateSnapPoints } from "../helpers/validate-snap-points";
import { computeClaimedDirections } from "../ownership/compute-claimed-directions";
import { resolveOwnership } from "../ownership/resolve-ownership";
import type { ScreenGestureConfig } from "../types";

export function useScreenGestureConfig(): ScreenGestureConfig {
	const gestureContext = useGestureContext();
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
			ownershipStatus: resolveOwnership(claimedDirections, gestureContext),
		};
	}, [
		currentScreenKey,
		isFirstKey,
		gestureEnabled,
		gestureDirection,
		snapPoints,
		gestureContext,
	]);
}
