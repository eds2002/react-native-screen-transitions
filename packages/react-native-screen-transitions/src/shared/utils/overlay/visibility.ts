import type { OverlayMode } from "../../types/overlay.types";

type OverlayOptionsLike = {
	overlay?: unknown;
	overlayMode?: OverlayMode;
	overlayShown?: boolean;
};

const isOverlayVisible = (options?: OverlayOptionsLike): boolean => {
	return Boolean(options?.overlay) && options?.overlayShown !== false;
};

export const isFloatOverlayVisible = (
	options?: OverlayOptionsLike,
): boolean => {
	return isOverlayVisible(options) && options?.overlayMode !== "screen";
};

export const isScreenOverlayVisible = (
	options?: OverlayOptionsLike,
): boolean => {
	return isOverlayVisible(options) && options?.overlayMode === "screen";
};
