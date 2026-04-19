type OverlayOptionsLike = {
	overlay?: unknown;
	overlayShown?: boolean;
};

export const isOverlayVisible = (options?: OverlayOptionsLike): boolean => {
	return Boolean(options?.overlay) && options?.overlayShown !== false;
};
