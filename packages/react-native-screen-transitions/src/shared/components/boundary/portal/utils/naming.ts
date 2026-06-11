export const PORTAL_HOST_NAME_RESET_VALUE = "--";
const PORTAL_HOST_NAME_SUFFIX = "-portal-host";

export const createPortalBoundaryHostName = (
	hostKey: string,
	boundaryId: string,
) => {
	"worklet";
	return `${hostKey}-${boundaryId}${PORTAL_HOST_NAME_SUFFIX}`;
};

export const createPortalName = (id: string) => {
	"worklet";
	return `${id}-portal`;
};
