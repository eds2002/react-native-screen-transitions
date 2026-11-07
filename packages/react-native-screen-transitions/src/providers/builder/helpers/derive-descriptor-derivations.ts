import type { ScreenPairKey } from "../../../stores/bounds";
import { createScreenPairKey } from "../../../stores/bounds";
import type { BaseStackDescriptor } from "../../../types/stack.types";

export interface DescriptorDerivations {
	previousScreenKey?: string;
	currentScreenKey: string;
	nextScreenKey?: string;
	sourcePairKey?: ScreenPairKey;
	destinationPairKey?: ScreenPairKey;
	/** The host's first route. Gestures can't dismiss it. */
	isFirstKey: boolean;
	/**
	 * Mounts already open at its initial snap point, without an open transition, and starts
	 * visible. A stack's first route does unless `experimental_animateOnInitialMount` is set.
	 */
	startsSettled: boolean;
	isTopMostScreen: boolean;
	hasConfiguredInterpolator: boolean;
}

interface Params {
	previous?: BaseStackDescriptor;
	current: BaseStackDescriptor;
	next?: BaseStackDescriptor;
	/** The host's first route. Without a host, no screen is first. */
	firstRouteKey?: string;
	/** Overrides the stack rule for units that decide how they mount (see `useMotion`). */
	startsSettled?: boolean;
}

export function deriveDescriptorDerivations({
	previous,
	current,
	next,
	firstRouteKey,
	startsSettled,
}: Params): DescriptorDerivations {
	const previousScreenKey = previous?.route.key;
	const currentScreenKey = current.route.key;
	const nextScreenKey = next?.route.key;
	const sourcePairKey = nextScreenKey
		? createScreenPairKey(currentScreenKey, nextScreenKey)
		: undefined;
	const destinationPairKey = previousScreenKey
		? createScreenPairKey(previousScreenKey, currentScreenKey)
		: undefined;

	const isFirstKey =
		firstRouteKey !== undefined && current.route.key === firstRouteKey;
	const isTopMostScreen = !next;
	const hasConfiguredInterpolator =
		!!current.options.screenStyleInterpolator ||
		!!next?.options?.screenStyleInterpolator;

	return {
		previousScreenKey,
		currentScreenKey,
		nextScreenKey,
		sourcePairKey,
		destinationPairKey,
		isFirstKey,
		startsSettled:
			startsSettled ??
			(isFirstKey && !current.options.experimental_animateOnInitialMount),
		isTopMostScreen,
		hasConfiguredInterpolator,
	};
}
