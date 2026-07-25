import type { ScreenInterpolatorFrame } from "../../animation/helpers/pipeline";

export type SelectedInterpolatorFrame = Pick<
	ScreenInterpolatorFrame,
	| "progress"
	| "transitionProgress"
	| "next"
	| "focused"
	| "active"
	| "inactive"
	| "logicallySettled"
>;

export const selectInterpolatorFrame = (
	frame: ScreenInterpolatorFrame,
	useCurrentOnly: boolean,
): SelectedInterpolatorFrame => {
	"worklet";

	if (!useCurrentOnly) {
		return {
			progress: frame.progress,
			transitionProgress: frame.transitionProgress,
			next: frame.next,
			focused: frame.focused,
			active: frame.active,
			inactive: frame.inactive,
			logicallySettled: frame.logicallySettled,
		};
	}

	return {
		progress: frame.current.progress,
		transitionProgress: frame.current.transitionProgress,
		next: undefined,
		focused: true,
		active: frame.current,
		inactive: frame.previous,
		logicallySettled: frame.current.settled,
	};
};
