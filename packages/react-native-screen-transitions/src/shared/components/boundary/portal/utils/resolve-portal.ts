import { logger } from "../../../../utils/logger";
import { isTeleportAvailable } from "../teleport";

export type BoundaryPortalRuntime = {
	handoff: boolean;
	escapeClipping: boolean;
	enabled: boolean;
};

type ResolveBoundaryPortalParams = {
	handoff?: boolean;
	escapeClipping?: boolean;
};

export const resolveBoundaryPortal = ({
	handoff,
	escapeClipping,
}: ResolveBoundaryPortalParams): BoundaryPortalRuntime => {
	const resolvedHandoff = handoff ?? false;
	const resolvedEscapeClipping = escapeClipping ?? false;

	const enabled = resolvedHandoff || resolvedEscapeClipping;

	if (!enabled) {
		return {
			handoff: false,
			escapeClipping: false,
			enabled: false,
		};
	}

	if (!isTeleportAvailable) {
		logger.warnOnce(
			"boundary:teleport-missing",
			"react-native-teleport is not installed; handoff and escapeClipping boundaries will render inline.",
		);

		return {
			handoff: false,
			escapeClipping: false,
			enabled: false,
		};
	}

	return {
		handoff: resolvedHandoff,
		escapeClipping: resolvedEscapeClipping,
		enabled,
	};
};
