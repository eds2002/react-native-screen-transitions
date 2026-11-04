const BOUNDARY_PORTAL_HOST_NAME_SUFFIX = "-portal-host";

export const createBoundaryPortalHostName = (
	hostKey: string,
	boundaryId: string,
	pairKey?: string | null,
) => {
	"worklet";
	return `${hostKey}-${pairKey ? `${pairKey}-` : ""}${boundaryId}${BOUNDARY_PORTAL_HOST_NAME_SUFFIX}`;
};

export const PORTAL_HOST_NAME_RESET_VALUE = null;

const BOUNDARY_CONTENT_PORTAL_HOST_NAME_SUFFIX = "-content-portal-host";

export const createHandoffHostName = (
	screenKey: string,
	boundaryId: string,
) => {
	"worklet";
	return `${screenKey}-${boundaryId}${BOUNDARY_CONTENT_PORTAL_HOST_NAME_SUFFIX}`;
};
