import { updateDerivations } from "../../../providers/screen/orchestrator/helpers/derivations";
import type { ScreenInterpolatorFrame } from "../../../providers/screen/orchestrator/helpers/pipeline";

export const shouldUseOverlayGestureDriver = (
	overlayFrame: ScreenInterpolatorFrame,
	driverFrame: ScreenInterpolatorFrame,
): boolean => {
	"worklet";
	const gesture = overlayFrame.current.gesture;

	return (
		driverFrame.current.route.key !== overlayFrame.current.route.key &&
		!!(gesture.dragging || gesture.dismissing || gesture.settling)
	);
};

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
	frame.stackProgress = overlayFrame.stackProgress;

	return frame;
};
