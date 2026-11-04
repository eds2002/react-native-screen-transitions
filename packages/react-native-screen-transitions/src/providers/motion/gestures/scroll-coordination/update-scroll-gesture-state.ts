import type {
	ScrollGestureAxis,
	ScrollGestureAxisState,
	ScrollGestureState,
	ScrollMetadataState,
} from "../types";

function createScrollGestureAxisState(): ScrollGestureAxisState {
	"worklet";
	return { offset: 0, contentSize: 0, layoutSize: 0, isTouched: false };
}

const createScrollGestureState = (): ScrollGestureState => {
	"worklet";
	return {
		vertical: createScrollGestureAxisState(),
		horizontal: createScrollGestureAxisState(),
	};
};

const createScrollMetadataState = (): ScrollMetadataState => {
	"worklet";
	return {
		vertical: null,
		horizontal: null,
	};
};

export const updateScrollGestureAxisState = (
	state: ScrollGestureState | null,
	axis: ScrollGestureAxis,
	patch: Partial<ScrollGestureAxisState> & { isTouched?: boolean },
): ScrollGestureState => {
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
		axisState.isTouched = patch.isTouched;
	}

	return nextState;
};

export const updateScrollMetadataAxisState = (
	state: ScrollMetadataState | null,
	axis: ScrollGestureAxis,
	patch: Partial<ScrollGestureAxisState> & { isTouched?: boolean },
): ScrollMetadataState => {
	"worklet";

	const nextState = state ?? createScrollMetadataState();
	const axisState = nextState[axis] ?? createScrollGestureAxisState();
	nextState[axis] = axisState;

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
		axisState.isTouched = patch.isTouched;
	}

	return nextState;
};

export const clearScrollMetadataAxisState = (
	state: ScrollMetadataState | null,
	axis: ScrollGestureAxis,
): ScrollMetadataState | null => {
	"worklet";
	if (!state) return null;

	state[axis] = null;

	return state.vertical || state.horizontal ? state : null;
};
