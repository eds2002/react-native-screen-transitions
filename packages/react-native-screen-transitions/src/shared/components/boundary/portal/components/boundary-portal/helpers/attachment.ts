import type { BoundaryTeleportControl } from "../../../../../../types/animation.types";
import { isTeleportEnabled } from "../../../utils/teleport-control";

export const shouldAttachBoundaryPortal = ({
	focused,
	portalHostReady,
	slotActive,
	teleport,
}: {
	focused: boolean;
	portalHostReady: boolean;
	slotActive: boolean;
	teleport?: BoundaryTeleportControl;
}) => {
	"worklet";
	return (
		slotActive && !focused && portalHostReady && isTeleportEnabled(teleport)
	);
};
