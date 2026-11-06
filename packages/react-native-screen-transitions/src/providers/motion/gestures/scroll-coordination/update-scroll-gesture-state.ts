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

const hasScrollViews = (state: ScrollMetadataState) => {
	"worklet";
	if (!state.views) return false;
	for (const _id in state.views) return true;
	return false;
};

export const clearScrollMetadataAxisState = (
	state: ScrollMetadataState | null,
	axis: ScrollGestureAxis,
): ScrollMetadataState | null => {
	"worklet";
	if (!state) return null;

	state[axis] = null;

	return state.vertical || state.horizontal || hasScrollViews(state)
		? state
		: null;
};

export const updateScrollViewState = (
	state: ScrollMetadataState | null,
	id: string,
	axis: ScrollGestureAxis,
	patch: Partial<ScrollGestureAxisState>,
): ScrollMetadataState => {
	"worklet";

	const nextState = state ?? createScrollMetadataState();
	const views = nextState.views ?? {};
	nextState.views = views;
	const view = views[id] ?? { axis, ...createScrollGestureAxisState() };
	views[id] = view;

	if (patch.offset !== undefined) view.offset = patch.offset;
	if (patch.contentSize !== undefined) view.contentSize = patch.contentSize;
	if (patch.layoutSize !== undefined) view.layoutSize = patch.layoutSize;

	return nextState;
};

export const removeScrollViewState = (
	state: ScrollMetadataState | null,
	id: string,
): ScrollMetadataState | null => {
	"worklet";
	if (!state?.views?.[id]) return state;

	delete state.views[id];

	return state.vertical || state.horizontal || hasScrollViews(state)
		? state
		: null;
};
