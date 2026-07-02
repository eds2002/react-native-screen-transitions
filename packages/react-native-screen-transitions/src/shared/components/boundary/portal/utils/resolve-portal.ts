import { logger } from "../../../../utils/logger";
import type { BoundaryPortal } from "../../types";
import { isTeleportAvailable } from "../teleport";

export type BoundaryPortalRuntime = {
	handoff: boolean;
	escapeClipping: boolean;
	enabled: boolean;
};

type ResolveBoundaryPortalParams = {
	portal?: BoundaryPortal;
	handoff?: boolean;
	escapeClipping?: boolean;
};

/**
 * Resolves the new explicit runtime props plus the deprecated `portal` prop.
 * Legacy mapping:
 * - `true` / `"boundary-local"` => live handoff only
 * - `"screen"` => live handoff + current-screen clipping escape
 */
export const resolveBoundaryPortal = ({
	portal,
	handoff,
	escapeClipping,
}: ResolveBoundaryPortalParams): BoundaryPortalRuntime => {
	let resolvedHandoff = handoff ?? false;
	let resolvedEscapeClipping = escapeClipping ?? false;

	if (portal) {
		if (handoff === undefined) {
			resolvedHandoff = true;
		}

		if (escapeClipping === undefined) {
			resolvedEscapeClipping = portal === "screen";
		}
	}

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
