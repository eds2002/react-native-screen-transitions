import type { BoundsPortalHost } from "../../../../stores/bounds/types";
import type { BoundaryTeleportControl } from "../../../../types/animation.types";

export const isTeleportEnabled = (
	teleport: BoundaryTeleportControl | undefined,
) => {
	"worklet";

	if (typeof teleport === "boolean") {
		return teleport;
	}

	return teleport?.enabled !== false;
};

export const shouldAttachBoundaryPortal = ({
	portalHost,
	teleport,
}: {
	portalHost?: BoundsPortalHost;
	teleport?: BoundaryTeleportControl;
}) => {
	"worklet";

	return !!portalHost && isTeleportEnabled(teleport);
};
