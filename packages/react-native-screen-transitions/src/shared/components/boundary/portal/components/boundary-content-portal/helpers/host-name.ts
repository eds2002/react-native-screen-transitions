const BOUNDARY_CONTENT_PORTAL_HOST_NAME_SUFFIX = "-content-portal-host";

export const createBoundaryContentPortalHostName = (
	screenKey: string,
	boundaryId: string,
) => {
	"worklet";
	return `${screenKey}-${boundaryId}${BOUNDARY_CONTENT_PORTAL_HOST_NAME_SUFFIX}`;
};
