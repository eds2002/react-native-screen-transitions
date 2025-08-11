import type { BoundEntry } from "src/types/bounds";

import type { GetBoundsParams } from "./_types/get-bounds";

const fallbackBounds = {
	bounds: {
		width: 0,
		height: 0,
		x: 0,
		y: 0,
		pageX: 0,
		pageY: 0,
	},
	styles: {},
};

export const getBounds = (props: GetBoundsParams): BoundEntry => {
	"worklet";
	const boundId = props.id;
	const phase = props.phase;

	if (phase && boundId) {
		let phaseBounds = null;

		if (phase === "current") {
			phaseBounds = props.current?.bounds[boundId];
		} else if (phase === "next") {
			phaseBounds = props.next?.bounds[boundId];
		} else {
			phaseBounds = props.previous?.bounds[boundId];
		}

		if (!phaseBounds) {
			return fallbackBounds;
		}

		return {
			bounds: phaseBounds.bounds,
			styles: phaseBounds?.styles,
		};
	}

	if (!props.next && boundId) {
		const previousBounds = props.previous?.bounds[boundId];

		return previousBounds || fallbackBounds;
	}

	if (boundId) {
		const nextBounds = props.next?.bounds[boundId];

		return nextBounds || fallbackBounds;
	}

	return fallbackBounds;
};
