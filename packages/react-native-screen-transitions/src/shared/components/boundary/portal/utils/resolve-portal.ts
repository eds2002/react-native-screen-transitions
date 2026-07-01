import type { BoundsPortalHost } from "../../../../stores/bounds/types";
import { logger } from "../../../../utils/logger";
import type { BoundaryPortal } from "../../types";
import { isTeleportAvailable } from "../teleport";

/**
 * Resolves the `portal` prop against teleport availability. When
 * `react-native-teleport` is missing, portal boundaries degrade to inline
 * rendering and we warn once for the whole app.
 */
export const resolveBoundaryPortal = (
	portal?: BoundaryPortal,
): BoundsPortalHost | undefined => {
	if (!portal) {
		return undefined;
	}

	if (isTeleportAvailable) {
		return portal === true ? "boundary-local" : portal;
	}

	if (portal) {
		logger.warnOnce(
			"boundary:teleport-missing",
			"react-native-teleport is not installed and will fallback to default behavior.",
		);
	}

	return undefined;
};
