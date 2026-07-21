import type { StyleProps, TransformArrayItem } from "react-native-reanimated";

export const BOUNDS_LOCAL_TRANSFORM_STYLE_KEY =
	"__screenTransitionsBoundsLocalTransform";

type BoundsLocalTransformStyle = StyleProps & {
	[BOUNDS_LOCAL_TRANSFORM_STYLE_KEY]?: TransformArrayItem[];
};

const getTransformFromPreparedStyle = (
	style: unknown,
): TransformArrayItem[] | undefined => {
	"worklet";

	if (
		style === null ||
		style === undefined ||
		typeof style !== "object" ||
		Array.isArray(style)
	) {
		return undefined;
	}

	const transform = (style as Record<string, unknown>).transform;

	return Array.isArray(transform)
		? (transform as TransformArrayItem[])
		: undefined;
};

export const attachBoundsLocalTransform = (
	slotStyle: StyleProps,
	localStyle: StyleProps | null | undefined,
): StyleProps => {
	"worklet";
	const localTransform = getTransformFromPreparedStyle(localStyle);

	if (!localTransform?.length) {
		return slotStyle;
	}

	const next: Record<string, unknown> = {};
	const source = slotStyle as Record<string, unknown>;

	for (const key in source) {
		next[key] = source[key];
	}

	next[BOUNDS_LOCAL_TRANSFORM_STYLE_KEY] = localTransform;

	return next as BoundsLocalTransformStyle;
};

export const getBoundsLocalTransform = (
	style: StyleProps | undefined,
): TransformArrayItem[] | undefined => {
	"worklet";
	if (!style) {
		return undefined;
	}

	return (style as BoundsLocalTransformStyle)[BOUNDS_LOCAL_TRANSFORM_STYLE_KEY];
};

export const stripBoundsLocalTransform = (style: StyleProps): StyleProps => {
	"worklet";
	if (
		(style as BoundsLocalTransformStyle)[BOUNDS_LOCAL_TRANSFORM_STYLE_KEY] ===
		undefined
	) {
		return style;
	}

	const rest: Record<string, unknown> = {};
	const source = style as Record<string, unknown>;

	for (const key in source) {
		if (key === BOUNDS_LOCAL_TRANSFORM_STYLE_KEY) {
			continue;
		}

		rest[key] = source[key];
	}

	return rest as StyleProps;
};
