import type { ViewStyle } from "react-native";
import type { StyleProps, TransformArrayItem } from "react-native-reanimated";
import type { SmoothClipPresentation } from "react-native-smooth-clip-view";

export type TransitionClipMaximumSize = Readonly<{
	height: number;
	width: number;
}>;

export type ClipHostLayoutMode = "fill" | "fixed";

export const resolveClipHostFootprintStyle = (
	maximumSize: TransitionClipMaximumSize,
	layoutMode: ClipHostLayoutMode,
): ViewStyle =>
	layoutMode === "fill"
		? { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }
		: { height: maximumSize.height, width: maximumSize.width };

export const assertValidMaximumSize = (
	maximumSize: TransitionClipMaximumSize,
) => {
	if (
		!Number.isFinite(maximumSize.width) ||
		!Number.isFinite(maximumSize.height) ||
		maximumSize.width <= 0 ||
		maximumSize.height <= 0
	) {
		throw new Error(
			"Transition.ClipView maximumSize.width and maximumSize.height must be finite numbers greater than zero.",
		);
	}
};

export const createDefaultClipPresentation = (
	maximumSize: TransitionClipMaximumSize,
): SmoothClipPresentation => ({
	clip: {
		x: 0,
		y: 0,
		width: maximumSize.width,
		height: maximumSize.height,
		radius: 0,
		curve: "circular",
	},
	contentTranslateX: 0,
	contentTranslateY: 0,
	contentScale: 1,
});

const HOST_DIMENSION_KEYS = [
	"width",
	"height",
	"minWidth",
	"minHeight",
	"maxWidth",
	"maxHeight",
	"aspectRatio",
	"flex",
	"flexBasis",
	"flexGrow",
	"flexShrink",
	"boxSizing",
] as const;

/** Removes every Yoga input that can override the fixed native-host footprint. */
export const resolveClipHostStyle = (
	flattenedHostStyle: ViewStyle | undefined,
): Readonly<{
	hasConflictingDimensions: boolean;
	resolvedHostStyle: ViewStyle | undefined;
}> => {
	if (flattenedHostStyle === undefined) {
		return {
			hasConflictingDimensions: false,
			resolvedHostStyle: undefined,
		};
	}

	const resolved = { ...flattenedHostStyle } as Record<string, unknown>;
	let hasConflictingDimensions = false;
	for (let index = 0; index < HOST_DIMENSION_KEYS.length; index += 1) {
		const key = HOST_DIMENSION_KEYS[index];
		if (key === undefined) continue;
		if (resolved[key] !== undefined) hasConflictingDimensions = true;
		delete resolved[key];
	}

	return {
		hasConflictingDimensions,
		resolvedHostStyle: resolved as ViewStyle,
	};
};

const isApertureTransform = (transform: TransformArrayItem) => {
	"worklet";
	if (typeof transform !== "object" || transform === null) return false;
	return (
		"translateX" in transform ||
		"translateY" in transform ||
		"scale" in transform
	);
};

/**
 * Keeps visual effects on the carrier while an explicit clip owns aperture
 * geometry and compatible translation/scale. Width and height are always
 * excluded because maximumSize is the fixed native-host footprint.
 */
export const resolveClipVisualCarrierStyle = (
	style: StyleProps | undefined,
	hasExplicitClip: boolean,
): StyleProps => {
	"worklet";
	if (style === undefined) return {};
	const resolved = { ...style } as Record<string, unknown>;
	delete resolved.width;
	delete resolved.height;
	delete resolved.minWidth;
	delete resolved.minHeight;
	delete resolved.maxWidth;
	delete resolved.maxHeight;
	delete resolved.aspectRatio;

	if (!hasExplicitClip) return resolved as StyleProps;

	delete resolved.left;
	delete resolved.right;
	delete resolved.top;
	delete resolved.bottom;
	delete resolved.start;
	delete resolved.end;
	delete resolved.overflow;

	const transforms = resolved.transform;
	if (Array.isArray(transforms)) {
		const visualTransforms: TransformArrayItem[] = [];
		for (let index = 0; index < transforms.length; index += 1) {
			const transform = transforms[index] as TransformArrayItem | undefined;
			if (transform !== undefined && !isApertureTransform(transform)) {
				visualTransforms.push(transform);
			}
		}
		resolved.transform = visualTransforms;
	}

	return resolved as StyleProps;
};

/**
 * Screen content retains the pre-v4 RN style path until a clip channel has
 * explicitly taken ownership of aperture geometry.
 */
export const resolveScreenContentCarrierStyle = (
	style: StyleProps | undefined,
	hasExplicitClip: boolean,
): StyleProps => {
	"worklet";
	return hasExplicitClip
		? resolveClipVisualCarrierStyle(style, true)
		: (style ?? {});
};
