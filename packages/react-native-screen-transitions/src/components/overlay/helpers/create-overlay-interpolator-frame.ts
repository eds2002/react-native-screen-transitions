import { updateDerivations } from "../../../providers/screen/animation/helpers/derivations";
import type { ScreenInterpolatorFrame } from "../../../providers/screen/animation/helpers/pipeline";

export const createOverlayInterpolatorFrame = ({
	overlayFrame,
	driverFrame,
	previousOverlayFrame,
}: {
	overlayFrame: ScreenInterpolatorFrame;
	driverFrame: ScreenInterpolatorFrame;
	previousOverlayFrame?: ScreenInterpolatorFrame;
}): ScreenInterpolatorFrame => {
	"worklet";
	const current = overlayFrame.current;
	const driverIsCurrent = driverFrame.current.route.key === current.route.key;
	const frame: ScreenInterpolatorFrame = {
		...overlayFrame,
		previous: previousOverlayFrame?.current,
		current,
		next: driverIsCurrent ? undefined : driverFrame.current,
		layouts: current.layouts,
	};

	updateDerivations(frame);
	frame.stackProgress = frame.progress;
	frame.logicallySettled = frame.active.settled;

	return frame;
};
