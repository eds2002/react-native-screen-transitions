import type { ComponentProps } from "react";
import type { View } from "react-native";
import type { SmoothClipPresentation } from "react-native-smooth-clip-view";
import type Transition from "..";
import type { TransitionMaskedViewProps } from "..";

const baseClip: SmoothClipPresentation = {
	clip: {
		x: 0,
		y: 0,
		width: 320,
		height: 480,
		radius: 24,
		topLeftRadius: 32,
		curve: "continuous",
	},
	contentTranslateX: 0,
	contentTranslateY: 0,
	contentScale: 1,
};

const clipViewProps: ComponentProps<typeof Transition.ClipView> = {
	styleId: "hero-clip",
	maximumSize: { width: 320, height: 480 },
	clip: baseClip,
	hostStyle: { backgroundColor: "black" },
	contentStyle: { alignItems: "center" },
	accessible: true,
	onTouchEnd: () => {},
};

const boundaryClipViewProps: ComponentProps<
	typeof Transition.Boundary.ClipView
> = {
	id: "hero",
	maximumSize: { width: 320, height: 480 },
	clip: baseClip,
	handoff: true,
	escapeClipping: true,
};

const legacyMaskedViewProps: ComponentProps<typeof Transition.MaskedView> = {
	children: null,
	maximumSize: { width: 320, height: 480 },
	style: { flex: 1 },
};
const namedLegacyMaskedViewProps: TransitionMaskedViewProps =
	legacyMaskedViewProps;

// @ts-expect-error Transition.ClipView requires an explicit styleId.
const missingStyleId: ComponentProps<typeof Transition.ClipView> = {
	maximumSize: { width: 320, height: 480 },
};

// @ts-expect-error Transition.Boundary.ClipView uses a required id.
const missingBoundaryId: ComponentProps<typeof Transition.Boundary.ClipView> = {
	maximumSize: { width: 320, height: 480 },
};

declare const clipViewRef: View;
const viewCompatibleRef: View = clipViewRef;

void clipViewProps;
void boundaryClipViewProps;
void legacyMaskedViewProps;
void namedLegacyMaskedViewProps;
void missingStyleId;
void missingBoundaryId;
void viewCompatibleRef;
