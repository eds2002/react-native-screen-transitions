import type { BoundsPortalAttachTarget } from "../../../stores/bounds/types";
import { logger } from "../../../utils/logger";
import type { BoundaryPortal } from "../types";
import { isTeleportAvailable } from "./teleport";

/**
 * Resolves the `portal` prop against teleport availability. When
 * `react-native-teleport` is missing, portal boundaries degrade to inline
 * rendering and we warn once for the whole app.
 */
export const resolveBoundaryPortal = (
	portal?: BoundaryPortal,
): BoundaryPortal | undefined => {
	if (isTeleportAvailable) {
		return portal;
	}

	if (portal) {
		logger.warnOnce(
			"boundary:teleport-missing",
			"react-native-teleport is not installed and will fallback to default behavior.",
		);
	}

	return undefined;
};

/**
 * Resolves which screen host a portal'd boundary attaches to. Object form may
 * pin an explicit `attachTo`; bare `true` defaults to the current screen.
 */
export const resolvePortalHost = (
	portal?: BoundaryPortal,
): BoundsPortalAttachTarget | undefined => {
	if (typeof portal === "object") {
		return portal.attachTo ?? "current-screen";
	}

	return portal ? "current-screen" : undefined;
};
