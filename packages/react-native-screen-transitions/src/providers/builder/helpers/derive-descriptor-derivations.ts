import { createScreenPairKey } from "../../../stores/bounds/helpers/link-pairs.helpers";
import type { ScreenPairKey } from "../../../stores/bounds/types";
import type { BaseStackDescriptor } from "../../../types/stack.types";

export interface DescriptorDerivations {
	previousScreenKey?: string;
	currentScreenKey: string;
	nextScreenKey?: string;
	sourcePairKey?: ScreenPairKey;
	destinationPairKey?: ScreenPairKey;
	isFirstKey: boolean;
	isTopMostScreen: boolean;
	hasConfiguredInterpolator: boolean;
}

interface Params {
	previous?: BaseStackDescriptor;
	current: BaseStackDescriptor;
	next?: BaseStackDescriptor;
	/** The host's first route. Without a host, no screen is first. */
	firstRouteKey?: string;
}

export function deriveDescriptorDerivations({
	previous,
	current,
	next,
	firstRouteKey,
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
		isTopMostScreen,
		hasConfiguredInterpolator,
	};
}
