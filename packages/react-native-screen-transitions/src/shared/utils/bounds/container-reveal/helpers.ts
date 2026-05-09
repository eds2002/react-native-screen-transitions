import {
	interpolate,
	type MeasuredDimensions,
	makeMutable,
	type StyleProps,
} from "react-native-reanimated";
import { resolveTransitionPair } from "../../../stores/bounds/internals/resolver";
import type { ResolvedTransitionPair } from "../../../stores/bounds/types";

const presentedZoomTagByRoute = makeMutable<Record<string, string>>({});

type FrozenDestinationSnapshot = {
	bounds: MeasuredDimensions;
	styles: StyleProps | null;
	screenKey: string | null;
};

const frozenDestinationByRoute = makeMutable<
	Record<string, FrozenDestinationSnapshot>
>({});

export function getSourceBorderRadius(
	resolvedPair: ResolvedTransitionPair,
): number {
	"worklet";

	return typeof resolvedPair.sourceStyles?.borderRadius === "number"
		? resolvedPair.sourceStyles.borderRadius
		: 0;
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

export function resolveFrozenDestinationPair(params: {
	cacheKey: string;
	pair: ResolvedTransitionPair;
	closing: boolean;
}): ResolvedTransitionPair {
	"worklet";

	const { cacheKey, pair, closing } = params;

	if (!pair.destinationBounds) {
		return pair;
	}

	const frozen = frozenDestinationByRoute.get()[cacheKey];

	if (closing) {
		if (!frozen) {
			return pair;
		}

		return {
			...pair,
			destinationBounds: frozen.bounds,
			destinationStyles: frozen.styles,
			destinationScreenKey: frozen.screenKey,
		};
	}

	if (!frozen) {
		const destinationBounds = pair.destinationBounds;
		frozenDestinationByRoute.modify(
			<T extends Record<string, FrozenDestinationSnapshot>>(state: T): T => {
				"worklet";
				const mutableState = state as Record<string, FrozenDestinationSnapshot>;
				mutableState[cacheKey] = {
					bounds: destinationBounds,
					styles: pair.destinationStyles ? { ...pair.destinationStyles } : null,
					screenKey: pair.destinationScreenKey,
				};
				return state;
			},
		);
	}

	return pair;
}
