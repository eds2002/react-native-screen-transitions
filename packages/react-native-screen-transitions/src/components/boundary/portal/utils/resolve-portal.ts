import type { BoundaryRuntimeFlags } from "../../../../stores/bounds/types";
import { logger } from "../../../../utils/logger";
import { isTeleportAvailable } from "../teleport";

export const resolveBoundaryPortal = ({
	handoff = false,
	escapeClipping = false,
}: BoundaryRuntimeFlags) => {
	if (!isTeleportAvailable && (handoff || escapeClipping)) {
		logger.warnOnce(
			"boundary:teleport-missing",
			"react-native-teleport is not installed; handoff and escapeClipping boundaries will render inline.",
		);
	}
	return {
		handoff: isTeleportAvailable && handoff,
		escapeClipping: isTeleportAvailable && escapeClipping,
	};
};
