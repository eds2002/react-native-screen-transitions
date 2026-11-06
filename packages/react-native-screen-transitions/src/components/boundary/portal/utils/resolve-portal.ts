import type { BoundaryRuntimeFlags } from "../../../../stores/bounds/types";
import { logger } from "../../../../utils/logger";
import { isTeleportAvailable } from "../teleport";

/**
 * Boundaries escape clipping whenever react-native-teleport is installed: while a transition runs,
 * the boundary's frame moves to its screen's overlay, so a scroll view or an `overflow: hidden`
 * parent can't cut it off. Without Teleport (Expo Go, for one) boundaries render inline.
 * The `escapeClipping` prop is deprecated and ignored.
 */
export const resolveBoundaryPortal = ({
	handoff = false,
	escapeClipping,
}: BoundaryRuntimeFlags) => {
	if (escapeClipping !== undefined) {
		logger.warnOnce(
			"boundary:escape-clipping-deprecated",
			"escapeClipping is deprecated and has no effect: boundaries escape clipping automatically when react-native-teleport is installed.",
		);
	}
	if (!isTeleportAvailable && handoff) {
		logger.warnOnce(
			"boundary:teleport-missing",
			"react-native-teleport is not installed; handoff boundaries will render inline.",
		);
	}
	return {
		handoff: isTeleportAvailable && handoff,
		escapeClipping: isTeleportAvailable,
	};
};
