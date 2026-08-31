import type {
	CanonicalSmoothClipPresentation,
	ClipCurve,
	SmoothClipPresentation,
} from "react-native-smooth-clip-view";

export type LegacyClipFootprint = Readonly<{
	height: number;
	width: number;
}>;

/** Keeps content unclipped until a finite positive footprint first exists. */
export const updateLegacyClipFootprint = (
	previous: LegacyClipFootprint | null,
	width: unknown,
	height: unknown,
): LegacyClipFootprint | null => {
	if (
		typeof width !== "number" ||
		typeof height !== "number" ||
		!Number.isFinite(width) ||
		!Number.isFinite(height) ||
		width <= 0 ||
		height <= 0
	) {
		return previous;
	}
	if (previous?.width === width && previous.height === height) return previous;
	return { height, width };
};

export type LegacyClipProjectionReason =
	| "alpha-mask"
	| "ambiguous-horizontal-layout"
	| "ambiguous-vertical-layout"
	| "background-alpha-mask"
	| "invalid-curve"
	| "invalid-explicit-clip"
	| "invalid-footprint"
	| "invalid-layout-value"
	| "invalid-radius"
	| "invalid-transform"
	| "invalid-transform-origin"
	| "non-positive-scale"
	| "non-uniform-scale"
	| "unsupported-border"
	| "unsupported-layout"
	| "unsupported-shadow"
	| "unsupported-transform";

export type LegacyClipProjectionResult =
	| Readonly<{
			kind: "clip";
			presentation: CanonicalSmoothClipPresentation;
			source: "explicit" | "legacy";
	  }>
	| Readonly<{
			kind: "reset";
	  }>
	| Readonly<{
			detail?: string;
			kind: "fallback";
			reason: Exclude<
				LegacyClipProjectionReason,
				"alpha-mask" | "background-alpha-mask"
			>;
	  }>
	| Readonly<{
			detail?: string;
			kind: "unclipped";
			reason: "alpha-mask" | "background-alpha-mask";
	  }>;

export type ResolveLegacyClipProjectionOptions = Readonly<{
	/** `null` is the internal restore-base marker. */
	clip?: SmoothClipPresentation | null;
	footprint: LegacyClipFootprint;
	style?: Readonly<Record<string, unknown>>;
}>;

type ProjectionFailure = Exclude<
	LegacyClipProjectionResult,
	{ kind: "clip" } | { kind: "reset" }
>;

type ResolvedAxis = Readonly<{
	length: number;
	position: number;
}>;

type ResolvedTransform = Readonly<{
	scale: number;
	translateX: number;
	translateY: number;
}>;

const TRANSFORM_EPSILON = 1e-7;

const canonicalizePresentation = (
	presentation: SmoothClipPresentation,
): CanonicalSmoothClipPresentation | null => {
	"worklet";
	const { clip } = presentation;
	const contentScale = presentation.contentScale ?? 1;
	const curve = clip.curve ?? "circular";
	const optionalRadii = [
		clip.topLeftRadius,
		clip.topRightRadius,
		clip.bottomRightRadius,
		clip.bottomLeftRadius,
	];
	if (
		!Number.isFinite(clip.x) ||
		!Number.isFinite(clip.y) ||
		!Number.isFinite(clip.width) ||
		!Number.isFinite(clip.height) ||
		!Number.isFinite(clip.radius) ||
		!Number.isFinite(presentation.contentTranslateX) ||
		!Number.isFinite(presentation.contentTranslateY) ||
		!Number.isFinite(contentScale) ||
		contentScale <= 0 ||
		(curve !== "circular" && curve !== "continuous")
	) {
		return null;
	}
	for (let index = 0; index < optionalRadii.length; index += 1) {
		const radius = optionalRadii[index];
		if (radius !== undefined && !Number.isFinite(radius)) return null;
	}

	const width = Math.max(0, clip.width);
	const height = Math.max(0, clip.height);
	const topLeft = Math.max(0, clip.topLeftRadius ?? clip.radius);
	const topRight = Math.max(0, clip.topRightRadius ?? clip.radius);
	const bottomRight = Math.max(0, clip.bottomRightRadius ?? clip.radius);
	const bottomLeft = Math.max(0, clip.bottomLeftRadius ?? clip.radius);
	let radiusScale = 1;
	const top = topLeft + topRight;
	const right = topRight + bottomRight;
	const bottom = bottomLeft + bottomRight;
	const left = topLeft + bottomLeft;
	if (top > 0) radiusScale = Math.min(radiusScale, width / top);
	if (right > 0) radiusScale = Math.min(radiusScale, height / right);
	if (bottom > 0) radiusScale = Math.min(radiusScale, width / bottom);
	if (left > 0) radiusScale = Math.min(radiusScale, height / left);
	radiusScale = Math.max(0, Math.min(1, radiusScale));

	const topLeftRadius = topLeft * radiusScale;
	const topRightRadius = topRight * radiusScale;
	const bottomRightRadius = bottomRight * radiusScale;
	const bottomLeftRadius = bottomLeft * radiusScale;
	const radius =
		topLeftRadius === topRightRadius &&
		topRightRadius === bottomRightRadius &&
		bottomRightRadius === bottomLeftRadius
			? topLeftRadius
			: 0;

	return {
		clip: {
			x: clip.x,
			y: clip.y,
			width,
			height,
			radius,
			topLeftRadius,
			topRightRadius,
			bottomRightRadius,
			bottomLeftRadius,
			curve: curve as ClipCurve,
		},
		contentTranslateX: presentation.contentTranslateX,
		contentTranslateY: presentation.contentTranslateY,
		contentScale,
	};
};

const fallback = (
	reason: ProjectionFailure["reason"],
	detail?: string,
): ProjectionFailure => {
	"worklet";
	if (reason === "alpha-mask" || reason === "background-alpha-mask") {
		return { detail, kind: "unclipped", reason };
	}
	return { detail, kind: "fallback", reason };
};

const isFinitePositiveFootprint = (footprint: LegacyClipFootprint) => {
	"worklet";
	return (
		Number.isFinite(footprint.width) &&
		Number.isFinite(footprint.height) &&
		footprint.width > 0 &&
		footprint.height > 0
	);
};

const parsePercentage = (value: string): number | null => {
	"worklet";
	const trimmed = value.trim();
	if (!trimmed.endsWith("%")) return null;
	const numeric = Number(trimmed.slice(0, -1));
	return Number.isFinite(numeric) ? numeric / 100 : null;
};

const resolveLength = (value: unknown, basis: number): number | null => {
	"worklet";
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : null;
	}
	if (typeof value !== "string") return null;
	const percentage = parsePercentage(value);
	return percentage === null ? null : basis * percentage;
};

const hasStyleValue = (
	style: Readonly<Record<string, unknown>>,
	property: string,
) => {
	"worklet";
	return style[property] !== undefined;
};

const resolveAxis = ({
	basis,
	endProperty,
	lengthProperty,
	startProperty,
	style,
}: {
	basis: number;
	endProperty: "bottom" | "right";
	lengthProperty: "height" | "width";
	startProperty: "left" | "top";
	style: Readonly<Record<string, unknown>>;
}): ResolvedAxis | ProjectionFailure => {
	"worklet";
	const hasLength = hasStyleValue(style, lengthProperty);
	const hasStart = hasStyleValue(style, startProperty);
	const hasEnd = hasStyleValue(style, endProperty);
	const ambiguityReason =
		lengthProperty === "width"
			? "ambiguous-horizontal-layout"
			: "ambiguous-vertical-layout";

	if (hasLength && hasStart && hasEnd) {
		return fallback(
			ambiguityReason,
			`${startProperty}+${lengthProperty}+${endProperty}`,
		);
	}
	if (!hasLength && hasStart !== hasEnd) {
		return fallback(
			ambiguityReason,
			`${lengthProperty} is auto with only one positioned edge`,
		);
	}

	const start = hasStart ? resolveLength(style[startProperty], basis) : 0;
	const end = hasEnd ? resolveLength(style[endProperty], basis) : 0;
	if (start === null || end === null) {
		return fallback("invalid-layout-value", `${startProperty}/${endProperty}`);
	}

	let length: number;
	if (hasLength) {
		const resolved = resolveLength(style[lengthProperty], basis);
		if (resolved === null) {
			return fallback("invalid-layout-value", lengthProperty);
		}
		length = resolved;
	} else if (hasStart && hasEnd) {
		length = basis - start - end;
	} else {
		length = basis;
	}

	if (!Number.isFinite(length) || length < 0) {
		return fallback("invalid-layout-value", lengthProperty);
	}

	return {
		length,
		position: hasStart ? start : hasEnd ? basis - end - length : 0,
	};
};

const isProjectionFailure = (
	value: ResolvedAxis | ProjectionFailure,
): value is ProjectionFailure => {
	"worklet";
	return "kind" in value;
};

const unsupportedLayoutProperty = (
	style: Readonly<Record<string, unknown>>,
): string | null => {
	"worklet";
	const unsupported = [
		"aspectRatio",
		"end",
		"flex",
		"flexBasis",
		"flexGrow",
		"flexShrink",
		"inset",
		"margin",
		"marginBottom",
		"marginEnd",
		"marginHorizontal",
		"marginLeft",
		"marginRight",
		"marginStart",
		"marginTop",
		"marginVertical",
		"maxHeight",
		"maxWidth",
		"minHeight",
		"minWidth",
		"padding",
		"paddingBottom",
		"paddingEnd",
		"paddingHorizontal",
		"paddingLeft",
		"paddingRight",
		"paddingStart",
		"paddingTop",
		"paddingVertical",
		"start",
	];
	for (let index = 0; index < unsupported.length; index += 1) {
		const property = unsupported[index];
		if (property !== undefined && hasStyleValue(style, property)) {
			return property;
		}
	}
	return null;
};

const unsupportedBorderProperty = (
	style: Readonly<Record<string, unknown>>,
): string | null => {
	"worklet";
	const allowed = [
		"borderBottomLeftRadius",
		"borderBottomRightRadius",
		"borderContinuous",
		"borderCurve",
		"borderRadius",
		"borderTopLeftRadius",
		"borderTopRightRadius",
	];
	const keys = Object.keys(style);
	for (let index = 0; index < keys.length; index += 1) {
		const property = keys[index];
		if (property === undefined || !property.startsWith("border")) continue;
		let isAllowed = false;
		for (
			let allowedIndex = 0;
			allowedIndex < allowed.length;
			allowedIndex += 1
		) {
			if (property === allowed[allowedIndex]) {
				isAllowed = true;
				break;
			}
		}
		if (!isAllowed && hasStyleValue(style, property)) return property;
	}
	return null;
};

const unsupportedShadowProperty = (
	style: Readonly<Record<string, unknown>>,
): string | null => {
	"worklet";
	const keys = Object.keys(style);
	for (let index = 0; index < keys.length; index += 1) {
		const property = keys[index];
		if (
			property !== undefined &&
			hasStyleValue(style, property) &&
			(property.startsWith("shadow") ||
				property === "boxShadow" ||
				property === "elevation")
		) {
			return property;
		}
	}
	return null;
};

const colorAlpha = (value: unknown): number | null => {
	"worklet";
	if (typeof value === "number") {
		if (!Number.isInteger(value) || !Number.isFinite(value)) return null;
		return ((value >>> 24) & 0xff) / 255;
	}
	if (typeof value !== "string") return null;
	const color = value.trim().toLowerCase();
	if (color === "transparent") return 0;
	if (color.startsWith("#")) {
		if (color.length === 5) {
			const alpha = Number.parseInt(color.slice(4, 5), 16);
			return Number.isFinite(alpha) ? alpha / 15 : null;
		}
		if (color.length === 9) {
			const alpha = Number.parseInt(color.slice(7, 9), 16);
			return Number.isFinite(alpha) ? alpha / 255 : null;
		}
		return color.length === 4 || color.length === 7 ? 1 : null;
	}
	if (color.startsWith("rgba(") || color.startsWith("hsla(")) {
		const comma = color.lastIndexOf(",");
		const close = color.lastIndexOf(")");
		if (comma < 0 || close <= comma) return null;
		const component = color.slice(comma + 1, close).trim();
		const percentage = parsePercentage(component);
		if (percentage !== null) return percentage;
		const alpha = Number(component);
		return Number.isFinite(alpha) ? alpha : null;
	}
	if (color.includes("/")) {
		const slash = color.lastIndexOf("/");
		const close = color.lastIndexOf(")");
		if (close <= slash) return null;
		const component = color.slice(slash + 1, close).trim();
		const percentage = parsePercentage(component);
		if (percentage !== null) return percentage;
		const alpha = Number(component);
		return Number.isFinite(alpha) ? alpha : null;
	}
	if (color.startsWith("rgb(") || color.startsWith("hsl(")) return 1;
	// Named colors and the opaque rgb/hsl syntaxes are geometric-mask safe.
	return color.length > 0 ? 1 : null;
};

const resolveTransformOriginComponent = (
	value: unknown,
	basis: number,
	axis: "x" | "y",
): number | null => {
	"worklet";
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : null;
	}
	if (typeof value !== "string") return null;
	const normalized = value.trim().toLowerCase();
	if (normalized === "0") return 0;
	if (normalized === "center") return basis / 2;
	if (axis === "x" && normalized === "left") return 0;
	if (axis === "x" && normalized === "right") return basis;
	if (axis === "y" && normalized === "top") return 0;
	if (axis === "y" && normalized === "bottom") return basis;
	if (normalized.endsWith("px")) {
		const numeric = Number(normalized.slice(0, -2));
		return Number.isFinite(numeric) ? numeric : null;
	}
	return resolveLength(normalized, basis);
};

const resolveTransformOrigin = (
	value: unknown,
	width: number,
	height: number,
): Readonly<{ x: number; y: number }> | ProjectionFailure => {
	"worklet";
	if (value === undefined) return { x: width / 2, y: height / 2 };

	let components: readonly unknown[];
	if (Array.isArray(value)) {
		components = value;
	} else if (typeof value === "string") {
		const tokens = value.trim().split(/\s+/);
		const first = tokens[0]?.toLowerCase();
		const second = tokens[1]?.toLowerCase();
		const firstIsVertical = first === "top" || first === "bottom";
		const secondIsHorizontal = second === "left" || second === "right";
		if (tokens.length === 1) {
			// React Native follows CSS here: a lone vertical keyword owns y,
			// while every other lone value owns x. The omitted axis is centered.
			components = firstIsVertical
				? ["center", tokens[0]]
				: [tokens[0], "center"];
		} else {
			components =
				firstIsVertical || secondIsHorizontal
					? [tokens[1], tokens[0], tokens[2]]
					: tokens;
		}
	} else {
		return fallback("invalid-transform-origin");
	}
	if (components.length < 2 || components.length > 3) {
		return fallback("invalid-transform-origin");
	}
	const z = components[2];
	const resolvedZ =
		typeof z === "string" && z.trim().toLowerCase().endsWith("px")
			? Number(z.trim().slice(0, -2))
			: typeof z === "string" && z.trim() === "0"
				? 0
				: z;
	if (
		resolvedZ !== undefined &&
		(typeof resolvedZ !== "number" || !Number.isFinite(resolvedZ))
	) {
		return fallback("invalid-transform-origin", "z");
	}
	const x = resolveTransformOriginComponent(components[0], width, "x");
	const y = resolveTransformOriginComponent(components[1], height, "y");
	if (x === null || y === null) return fallback("invalid-transform-origin");
	return { x, y };
};

const isProjectionFailureOrigin = (
	value: Readonly<{ x: number; y: number }> | ProjectionFailure,
): value is ProjectionFailure => {
	"worklet";
	return "kind" in value;
};

const resolveTransform = (
	value: unknown,
	width: number,
	height: number,
): ResolvedTransform | ProjectionFailure => {
	"worklet";
	if (value === undefined) {
		return { scale: 1, translateX: 0, translateY: 0 };
	}
	if (!Array.isArray(value)) return fallback("invalid-transform");

	let scaleX = 1;
	let scaleY = 1;
	let translateX = 0;
	let translateY = 0;
	for (let index = 0; index < value.length; index += 1) {
		const operation = value[index];
		if (typeof operation !== "object" || operation === null) {
			return fallback("invalid-transform");
		}
		const keys = Object.keys(operation);
		if (keys.length !== 1) return fallback("invalid-transform");
		const property = keys[0];
		if (property === undefined) return fallback("invalid-transform");
		const operand = (operation as Readonly<Record<string, unknown>>)[property];

		if (property === "translateX" || property === "translateY") {
			const basis = property === "translateX" ? width : height;
			const translation = resolveLength(operand, basis);
			if (translation === null) return fallback("invalid-transform", property);
			if (property === "translateX") translateX += translation * scaleX;
			else translateY += translation * scaleY;
			continue;
		}
		if (property === "translate") {
			if (!Array.isArray(operand) || operand.length < 2 || operand.length > 3) {
				return fallback("invalid-transform", property);
			}
			const x = resolveLength(operand[0], width);
			const y = resolveLength(operand[1], height);
			const z = operand[2];
			if (
				x === null ||
				y === null ||
				(z !== undefined &&
					(typeof z !== "number" || !Number.isFinite(z) || z !== 0))
			) {
				return fallback("invalid-transform", property);
			}
			translateX += x * scaleX;
			translateY += y * scaleY;
			continue;
		}
		if (
			property === "scale" ||
			property === "scaleX" ||
			property === "scaleY"
		) {
			if (typeof operand !== "number" || !Number.isFinite(operand)) {
				return fallback("invalid-transform", property);
			}
			if (operand <= 0) return fallback("non-positive-scale", property);
			if (property !== "scaleY") scaleX *= operand;
			if (property !== "scaleX") scaleY *= operand;
			continue;
		}
		return fallback("unsupported-transform", property);
	}

	const scaleDifference = Math.abs(scaleX - scaleY);
	const scaleMagnitude = Math.max(1, Math.abs(scaleX), Math.abs(scaleY));
	if (scaleDifference > TRANSFORM_EPSILON * scaleMagnitude) {
		return fallback("non-uniform-scale");
	}
	return { scale: (scaleX + scaleY) / 2, translateX, translateY };
};

const isProjectionFailureTransform = (
	value: ResolvedTransform | ProjectionFailure,
): value is ProjectionFailure => {
	"worklet";
	return "kind" in value;
};

const resolveRadius = (
	value: unknown,
	fallbackRadius: number,
): number | null => {
	"worklet";
	if (value === undefined) return fallbackRadius;
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value
		: null;
};

const projectLegacyStyle = (
	style: Readonly<Record<string, unknown>>,
	footprint: LegacyClipFootprint,
): LegacyClipProjectionResult => {
	"worklet";
	if (!isFinitePositiveFootprint(footprint)) {
		return fallback("invalid-footprint");
	}

	const opacity = style.opacity;
	if (
		opacity !== undefined &&
		(typeof opacity !== "number" || !Number.isFinite(opacity) || opacity !== 1)
	) {
		return fallback("alpha-mask", "opacity");
	}
	if (style.backgroundColor !== undefined) {
		const alpha = colorAlpha(style.backgroundColor);
		if (alpha === null || alpha !== 1) {
			return fallback("background-alpha-mask", "backgroundColor");
		}
	}

	const borderProperty = unsupportedBorderProperty(style);
	if (borderProperty !== null) {
		return fallback("unsupported-border", borderProperty);
	}
	const shadowProperty = unsupportedShadowProperty(style);
	if (shadowProperty !== null) {
		return fallback("unsupported-shadow", shadowProperty);
	}
	const layoutProperty = unsupportedLayoutProperty(style);
	if (layoutProperty !== null) {
		return fallback("unsupported-layout", layoutProperty);
	}

	const horizontal = resolveAxis({
		basis: footprint.width,
		endProperty: "right",
		lengthProperty: "width",
		startProperty: "left",
		style,
	});
	if (isProjectionFailure(horizontal)) return horizontal;
	const vertical = resolveAxis({
		basis: footprint.height,
		endProperty: "bottom",
		lengthProperty: "height",
		startProperty: "top",
		style,
	});
	if (isProjectionFailure(vertical)) return vertical;

	const origin = resolveTransformOrigin(
		style.transformOrigin,
		horizontal.length,
		vertical.length,
	);
	if (isProjectionFailureOrigin(origin)) return origin;
	const transform = resolveTransform(
		style.transform,
		horizontal.length,
		vertical.length,
	);
	if (isProjectionFailureTransform(transform)) return transform;

	const baseRadius = resolveRadius(style.borderRadius, 0);
	if (baseRadius === null) return fallback("invalid-radius", "borderRadius");
	const topLeftRadius = resolveRadius(style.borderTopLeftRadius, baseRadius);
	const topRightRadius = resolveRadius(style.borderTopRightRadius, baseRadius);
	const bottomRightRadius = resolveRadius(
		style.borderBottomRightRadius,
		baseRadius,
	);
	const bottomLeftRadius = resolveRadius(
		style.borderBottomLeftRadius,
		baseRadius,
	);
	if (
		topLeftRadius === null ||
		topRightRadius === null ||
		bottomRightRadius === null ||
		bottomLeftRadius === null
	) {
		return fallback("invalid-radius");
	}

	const borderContinuous = style.borderContinuous;
	const borderCurve = style.borderCurve;
	if (
		(borderContinuous !== undefined && typeof borderContinuous !== "boolean") ||
		(borderCurve !== undefined &&
			borderCurve !== "circular" &&
			borderCurve !== "continuous") ||
		(borderContinuous === true && borderCurve === "circular") ||
		(borderContinuous === false && borderCurve === "continuous")
	) {
		return fallback("invalid-curve");
	}
	const curve =
		borderContinuous === true || borderCurve === "continuous"
			? "continuous"
			: "circular";

	const scale = transform.scale;
	const scaledTopLeftRadius = topLeftRadius * scale;
	const scaledTopRightRadius = topRightRadius * scale;
	const scaledBottomRightRadius = bottomRightRadius * scale;
	const scaledBottomLeftRadius = bottomLeftRadius * scale;
	const uniformRadius =
		scaledTopLeftRadius === scaledTopRightRadius &&
		scaledTopRightRadius === scaledBottomRightRadius &&
		scaledBottomRightRadius === scaledBottomLeftRadius;
	const presentation = canonicalizePresentation({
		clip: {
			x: horizontal.position + (1 - scale) * origin.x + transform.translateX,
			y: vertical.position + (1 - scale) * origin.y + transform.translateY,
			width: horizontal.length * scale,
			height: vertical.length * scale,
			radius: uniformRadius ? scaledTopLeftRadius : 0,
			topLeftRadius: scaledTopLeftRadius,
			topRightRadius: scaledTopRightRadius,
			bottomRightRadius: scaledBottomRightRadius,
			bottomLeftRadius: scaledBottomLeftRadius,
			curve,
		},
		contentTranslateX: 0,
		contentTranslateY: 0,
		contentScale: 1,
	});
	return presentation === null
		? fallback("invalid-layout-value")
		: { kind: "clip", presentation, source: "legacy" };
};

/**
 * Converts the geometric subset of a legacy alpha-mask style into a canonical
 * SmoothClip presentation. Unsupported input never yields a partial aperture.
 *
 * Transform operations intentionally follow React Native/CSS list ordering:
 * later operations are applied first. Percentage translations resolve against
 * the untransformed aperture width/height, matching React Native Fabric.
 */
export const resolveLegacyClipProjection = ({
	clip,
	footprint,
	style = {},
}: ResolveLegacyClipProjectionOptions): LegacyClipProjectionResult => {
	"worklet";
	if (clip === null) return { kind: "reset" };
	if (clip !== undefined) {
		const presentation = canonicalizePresentation(clip);
		return presentation === null
			? fallback("invalid-explicit-clip")
			: { kind: "clip", presentation, source: "explicit" };
	}
	return projectLegacyStyle(style, footprint);
};
