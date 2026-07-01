export const PORTAL_HOST_NAME_RESET_VALUE = null;
const PORTAL_HOST_NAME_SUFFIX = "-portal-host";
const BOUNDARY_LOCAL_PORTAL_HOST_NAME_SUFFIX = "-boundary-local-portal-host";

export const createPortalBoundaryHostName = (
	hostKey: string,
	boundaryId: string,
	pairKey?: string | null,
) => {
	"worklet";
	return `${hostKey}-${pairKey ? `${pairKey}-` : ""}${boundaryId}${PORTAL_HOST_NAME_SUFFIX}`;
};

export const createBoundaryLocalPortalHostName = (
	screenKey: string,
	boundaryId: string,
) => `${screenKey}-${boundaryId}${BOUNDARY_LOCAL_PORTAL_HOST_NAME_SUFFIX}`;
