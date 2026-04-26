import type {
	ScrollGestureAxis,
	ScrollGestureAxisState,
	ScrollGestureState,
} from "../../types";

const createScrollGestureState = (): ScrollGestureState => {
	"worklet";
	return {
		vertical: { offset: 0, contentSize: 0, layoutSize: 0 },
		horizontal: { offset: 0, contentSize: 0, layoutSize: 0 },
		isTouched: false,
	};
};

export const updateScrollGestureAxisState = <
	T extends ScrollGestureState | null,
>(
	state: T,
	axis: ScrollGestureAxis,
	patch: Partial<ScrollGestureAxisState> & { isTouched?: boolean },
): T => {
	"worklet";

	const nextState = state ?? createScrollGestureState();

	const axisState = nextState[axis];

	if (patch.offset !== undefined) {
		axisState.offset = patch.offset;
	}

	if (patch.contentSize !== undefined) {
		axisState.contentSize = patch.contentSize;
	}

	if (patch.layoutSize !== undefined) {
		axisState.layoutSize = patch.layoutSize;
	}

	if (patch.isTouched !== undefined) {
		nextState.isTouched = patch.isTouched;
	}

	return nextState as T;
};
