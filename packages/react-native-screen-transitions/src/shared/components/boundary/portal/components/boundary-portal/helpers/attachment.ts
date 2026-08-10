import type { BoundaryTeleportControl } from "../../../../../../types/animation.types";
import { isTeleportEnabled } from "../../../utils/teleport-control";

export const shouldAttachBoundaryPortal = ({
	focused,
	portalHostReady,
	teleport,
}: {
	focused: boolean;
	portalHostReady: boolean;
	teleport?: BoundaryTeleportControl;
}) => {
	"worklet";
	return !focused && portalHostReady && isTeleportEnabled(teleport);
};
