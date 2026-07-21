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
	enabled,
	teleport,
}: {
	enabled: boolean;
	teleport?: BoundaryTeleportControl;
}) => {
	"worklet";

	return enabled && isTeleportEnabled(teleport);
};
