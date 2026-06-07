export const PORTAL_HOST_NAME_RESET_VALUE = "--";

export const createPortalHostName = (screenKey: string) => {
	"worklet";
	return `${screenKey}-portal-host`;
};

export const createPortalName = (id: string) => {
	"worklet";
	return `${id}-portal`;
};
