import { interpolate, makeMutable } from "react-native-reanimated";
import { resolveTransitionPair } from "../../../stores/bounds/internals/resolver";
import type { ResolvedTransitionPair } from "../../../stores/bounds/types";
import type { Layout } from "../../../types/screen.types";
import type { BoundsOptions } from "../types/options";
import {
	ZOOM_BACKGROUND_SCALE,
	ZOOM_DRAG_DIRECTIONAL_SCALE_EXPONENT,
	ZOOM_DRAG_DIRECTIONAL_SCALE_MAX,
	ZOOM_DRAG_DIRECTIONAL_SCALE_MIN,
	ZOOM_DRAG_TRANSLATION_EXPONENT,
	ZOOM_DRAG_TRANSLATION_NEGATIVE_MAX,
	ZOOM_DRAG_TRANSLATION_POSITIVE_MAX,
} from "./config";

const presentedZoomTagByRoute = makeMutable<Record<string, string>>({});

export function getSourceBorderRadius(
	resolvedPair: ResolvedTransitionPair,
): number {
	"worklet";

	return typeof resolvedPair.sourceStyles?.borderRadius === "number"
		? resolvedPair.sourceStyles.borderRadius
		: 0;
}

export function getZoomContentTarget({
	explicitTarget,
	screenLayout,
	anchor,
	resolvedPair,
}: {
	explicitTarget: BoundsOptions["target"] | undefined;
	screenLayout: Layout;
	anchor: BoundsOptions["anchor"] | undefined;
	resolvedPair: ResolvedTransitionPair;
}) {
	"worklet";

	if (explicitTarget) return explicitTarget;

	const sourceBounds = resolvedPair.sourceBounds;
	const screenWidth = screenLayout.width;

	if (!sourceBounds || sourceBounds.width <= 0 || screenWidth <= 0) {
		return "fullscreen" as const;
	}

	const height = (sourceBounds.height / sourceBounds.width) * screenWidth;
	const verticalAnchor =
		anchor === "bottomLeading" ||
		anchor === "bottom" ||
		anchor === "bottomTrailing"
			? "bottom"
			: anchor === "center" || anchor === "leading" || anchor === "trailing"
				? "center"
				: "top";
	const y =
		verticalAnchor === "top"
			? 0
			: verticalAnchor === "bottom"
				? screenLayout.height - height
				: (screenLayout.height - height) / 2;

	return {
		x: 0,
		y,
		pageX: 0,
		pageY: y,
		width: screenWidth,
		height,
	};
}

export function resolveDragScaleTuple(
	value:
		| readonly [shrinkMin: number, growMax: number, exponent?: number]
		| undefined,
) {
	"worklet";

	return {
		shrinkMin: value?.[0] ?? ZOOM_DRAG_DIRECTIONAL_SCALE_MIN,
		growMax: value?.[1] ?? ZOOM_DRAG_DIRECTIONAL_SCALE_MAX,
		exponent: value?.[2] ?? ZOOM_DRAG_DIRECTIONAL_SCALE_EXPONENT,
	};
}

export function resolveDragTranslationTuple(
	value:
		| readonly [negativeMax: number, positiveMax: number, exponent?: number]
		| undefined,
) {
	"worklet";

	return {
		negativeMax: value?.[0] ?? ZOOM_DRAG_TRANSLATION_NEGATIVE_MAX,
		positiveMax: value?.[1] ?? ZOOM_DRAG_TRANSLATION_POSITIVE_MAX,
		exponent: value?.[2] ?? ZOOM_DRAG_TRANSLATION_EXPONENT,
	};
}

export function resolveBackgroundScale(value: number | undefined) {
	"worklet";

	return value ?? ZOOM_BACKGROUND_SCALE;
}

export function interpolateOpacityRange(params: {
	progress: number;
	range: {
		inputStart: number;
		inputEnd: number;
		outputStart: number;
		outputEnd: number;
	};
}) {
	"worklet";

	const { progress, range } = params;

	return interpolate(
		progress,
		[range.inputStart, range.inputEnd],
		[range.outputStart, range.outputEnd],
		"clamp",
	);
}

export function resolvePresentedZoomTag(params: {
	requestedTag: string;
	activeRouteKey?: string;
	requestedPair: ResolvedTransitionPair;
	currentScreenKey?: string;
	previousScreenKey?: string;
	nextScreenKey?: string;
	entering: boolean;
}) {
	"worklet";
	const {
		requestedTag,
		activeRouteKey,
		requestedPair,
		currentScreenKey,
		previousScreenKey,
		nextScreenKey,
		entering,
	} = params;

	if (!activeRouteKey || !requestedTag.includes(":")) {
		return {
			tag: requestedTag,
			pair: requestedPair,
		};
	}

	if (requestedPair.sourceBounds) {
		presentedZoomTagByRoute.modify(
			<T extends Record<string, string>>(state: T): T => {
				"worklet";
				const mutableState = state as Record<string, string>;
				mutableState[activeRouteKey] = requestedTag;
				return state;
			},
		);
		return {
			tag: requestedTag,
			pair: requestedPair,
		};
	}

	const cachedTag = presentedZoomTagByRoute.get()[activeRouteKey];
	if (!cachedTag || cachedTag === requestedTag) {
		return {
			tag: requestedTag,
			pair: requestedPair,
		};
	}

	const cachedPair = resolveTransitionPair(cachedTag, {
		currentScreenKey,
		previousScreenKey,
		nextScreenKey,
		entering,
	});

	if (!cachedPair.sourceBounds) {
		return {
			tag: requestedTag,
			pair: requestedPair,
		};
	}

	return {
		tag: cachedTag,
		pair: cachedPair,
	};
}
