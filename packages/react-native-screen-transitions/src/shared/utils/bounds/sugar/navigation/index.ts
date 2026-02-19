import { NO_NAVIGATION_STYLE } from "./helpers";
import { buildHeroNavigationStyles } from "./hero";
import type { BuildNavigationStylesParams } from "./types";
import { buildZoomNavigationStyles } from "./zoom";

export const buildNavigationStyles = (params: BuildNavigationStylesParams) => {
	"worklet";

	switch (params.preset) {
		case "hero":
			return buildHeroNavigationStyles(params);
		case "zoom":
			return buildZoomNavigationStyles(params);
		default:
			return NO_NAVIGATION_STYLE;
	}
};
