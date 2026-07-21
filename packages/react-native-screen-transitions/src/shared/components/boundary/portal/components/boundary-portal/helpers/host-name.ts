const BOUNDARY_PORTAL_HOST_NAME_SUFFIX = "-portal-host";

export const createBoundaryPortalHostName = (
	hostKey: string,
	boundaryId: string,
	pairKey?: string | null,
) => {
	"worklet";
	return `${hostKey}-${pairKey ? `${pairKey}-` : ""}${boundaryId}${BOUNDARY_PORTAL_HOST_NAME_SUFFIX}`;
};
