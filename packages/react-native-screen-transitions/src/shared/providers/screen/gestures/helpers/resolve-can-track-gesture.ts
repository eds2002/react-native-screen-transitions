export type GestureTrackingParticipationInput = {
	isFirstKey: boolean;
	canDismiss: boolean;
	hasSnapPoints: boolean;
	allowDisabledGestureTracking?: boolean;
};

export function resolveCanTrackGesture({
	isFirstKey,
	canDismiss,
	hasSnapPoints,
	allowDisabledGestureTracking,
}: GestureTrackingParticipationInput) {
	if (isFirstKey) {
		return false;
	}

	if (allowDisabledGestureTracking) {
		return true;
	}

	return canDismiss || hasSnapPoints;
}
