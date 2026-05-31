import type { ScreenTransitionState } from "../../../../types/animation.types";

interface DerivationsTarget {
	previous?: ScreenTransitionState;
	current: ScreenTransitionState;
	next?: ScreenTransitionState;
	progress: number;
	focused: boolean;
	active: ScreenTransitionState;
	inactive: ScreenTransitionState | undefined;
}

export const updateDerivations = (frame: DerivationsTarget) => {
	"worklet";

	frame.progress = frame.current.progress + (frame.next?.progress ?? 0);
	frame.focused = !frame.next;
	frame.active = frame.focused ? frame.current : (frame.next ?? frame.current);
	frame.inactive = frame.focused ? frame.previous : frame.current;
};
