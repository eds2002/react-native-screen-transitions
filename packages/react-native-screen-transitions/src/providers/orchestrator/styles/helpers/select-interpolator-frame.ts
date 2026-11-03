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

/**
 * The frame the next screen's interpolator styles this screen with. When this screen's own
 * interpolator also runs (on the current-only frame) and the two are composed, the next one should
 * only add the relationship (this screen being covered), so it sees this screen as fully open:
 * progress 1 + next. Otherwise a screen still entering, or a sheet resting below its top snap point,
 * gets its own offset twice (a screen pushed while it slid in jumped back ~100 pt). A screen that
 * is fully open is unaffected (its progress is already 1).
 */
export const selectNextInterpolatorFrame = (
	frame: ScreenInterpolatorFrame,
	composedWithCurrent: boolean,
): SelectedInterpolatorFrame => {
	"worklet";
	const selected = selectInterpolatorFrame(frame, false);
	if (!composedWithCurrent || !frame.next) {
		return selected;
	}
	return {
		...selected,
		progress: 1 + frame.next.progress,
		transitionProgress: 1 + frame.next.transitionProgress,
	};
};
