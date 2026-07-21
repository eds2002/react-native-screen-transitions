export const resolveNextVisiblePortalHostName = ({
	canSwitchImmediately,
	isInterpolatorReady,
	requestedName,
	shouldTeleport,
	visibleName,
}: {
	canSwitchImmediately?: boolean;
	isInterpolatorReady: boolean;
	requestedName: string | null;
	shouldTeleport: boolean;
	visibleName: string | null;
}) => {
	"worklet";
	if (!shouldTeleport) {
		return null;
	}

	if (requestedName && (canSwitchImmediately || isInterpolatorReady)) {
		return requestedName;
	}

	return visibleName;
};
