import { NO_STYLES } from "../../../../constants";
import type { BuildNavigationStylesParams } from "./types";
import { buildZoomNavigationStyles } from "./zoom";

export const buildNavigationStyles = (params: BuildNavigationStylesParams) => {
	"worklet";

	switch (params.preset) {
		case "zoom":
			return buildZoomNavigationStyles(params);
		default:
			return NO_STYLES;
	}
};
