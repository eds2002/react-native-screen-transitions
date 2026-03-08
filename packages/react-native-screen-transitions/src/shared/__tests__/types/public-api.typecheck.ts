import type {
	BoundsNavigationZoomOptions,
	TransitionInterpolatedStyle,
	TransitionSlotStyle,
} from "../..";

const slotStyle: TransitionSlotStyle = {
	style: {
		opacity: 1,
	},
	props: {
		intensity: 80,
	},
};

const nestedInterpolatedStyle: TransitionInterpolatedStyle = {
	content: slotStyle,
	backdrop: {
		opacity: 0.5,
	},
	surface: {
		style: {
			transform: [{ scale: 0.98 }],
		},
	},
	"hero-image": {
		style: {
			borderRadius: 24,
		},
	},
};

const legacyInterpolatedStyle: TransitionInterpolatedStyle = {
	contentStyle: {
		opacity: 1,
	},
	backdropStyle: {
		opacity: 0.5,
	},
	overlayStyle: {
		opacity: 0.25,
	},
};

const zoomOptions: BoundsNavigationZoomOptions = {
	mask: {
		borderRadius: { from: 24, to: 0 },
		borderTopLeftRadius: "auto",
		borderCurve: "continuous",
		outset: { bottom: 16 },
	},
	motion: {
		dragResistance: 0.32,
		dragDirectionalScaleMin: 0.2,
	},
};

export const publicApiTypecheck = {
	slotStyle,
	nestedInterpolatedStyle,
	legacyInterpolatedStyle,
	zoomOptions,
};
