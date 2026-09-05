import type { ScreenInterpolatorFrame } from "../../helpers/pipeline";

export type SelectedInterpolatorFrame = Pick<
	ScreenInterpolatorFrame,
	"progress" | "transitionProgress" | "next" | "focused" | "active" | "inactive"
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
		};
	}

	return {
		progress: frame.current.progress,
		transitionProgress: frame.current.transitionProgress,
		next: undefined,
		focused: true,
		active: frame.current,
		inactive: frame.previous,
	};
};
