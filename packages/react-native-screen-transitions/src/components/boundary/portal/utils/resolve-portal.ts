import { logger } from "../../../../utils/logger";
import { isTeleportAvailable } from "../teleport";

export type BoundaryPortalRuntime = Readonly<{
	handoff: boolean;
	escapeClipping: boolean;
}>;

type ResolveBoundaryPortalParams = {
	handoff?: boolean;
	escapeClipping?: boolean;
};

const DISABLED_RUNTIME: BoundaryPortalRuntime = {
	handoff: false,
	escapeClipping: false,
};
const HANDOFF_RUNTIME: BoundaryPortalRuntime = {
	handoff: true,
	escapeClipping: false,
};
const ESCAPE_CLIPPING_RUNTIME: BoundaryPortalRuntime = {
	handoff: false,
	escapeClipping: true,
};
const HANDOFF_ESCAPE_CLIPPING_RUNTIME: BoundaryPortalRuntime = {
	handoff: true,
	escapeClipping: true,
};

export const resolveBoundaryPortal = ({
	handoff,
	escapeClipping,
}: ResolveBoundaryPortalParams): BoundaryPortalRuntime => {
	const resolvedHandoff = handoff ?? false;
	const resolvedEscapeClipping = escapeClipping ?? false;

	const enabled = resolvedHandoff || resolvedEscapeClipping;

	if (!enabled) {
		return DISABLED_RUNTIME;
	}

	if (!isTeleportAvailable) {
		logger.warnOnce(
			"boundary:teleport-missing",
			"react-native-teleport is not installed; handoff and escapeClipping boundaries will render inline.",
		);

		return DISABLED_RUNTIME;
	}

	return resolvedHandoff
		? resolvedEscapeClipping
			? HANDOFF_ESCAPE_CLIPPING_RUNTIME
			: HANDOFF_RUNTIME
		: ESCAPE_CLIPPING_RUNTIME;
};
