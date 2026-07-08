export const PORTAL_HOST_NAME_RESET_VALUE = null;
const PORTAL_HOST_NAME_SUFFIX = "-portal-host";
const BOUNDARY_HANDOFF_PORTAL_HOST_NAME_SUFFIX = "-handoff-portal-host";

export const createPortalBoundaryHostName = (
	hostKey: string,
	boundaryId: string,
	pairKey?: string | null,
) => {
	"worklet";
	return `${hostKey}-${pairKey ? `${pairKey}-` : ""}${boundaryId}${PORTAL_HOST_NAME_SUFFIX}`;
};

export const createBoundaryHandoffPortalHostName = (
	screenKey: string,
	boundaryId: string,
) => {
	"worklet";
	return `${screenKey}-${boundaryId}${BOUNDARY_HANDOFF_PORTAL_HOST_NAME_SUFFIX}`;
};
