import { createScreenPairKey } from "../../../../stores/bounds/helpers/link-pairs.helpers";
import type { ScreenPairKey } from "../../../../stores/bounds/types";
import type { BaseStackDescriptor } from "../../../../types/stack.types";

export interface DescriptorDerivations {
	previousScreenKey?: string;
	currentScreenKey: string;
	nextScreenKey?: string;
	sourcePairKey?: ScreenPairKey;
	destinationPairKey?: ScreenPairKey;
	ancestorDestinationPairKey?: ScreenPairKey;
	parentScreenKey?: string;
	isFirstKey: boolean;
	isTopMostScreen: boolean;
	ancestorKeys: string[];
	hasConfiguredInterpolator: boolean;
}

interface Params {
	previous?: BaseStackDescriptor;
	current: BaseStackDescriptor;
	next?: BaseStackDescriptor;
	ancestorKeys: string[];
	ancestorDestinationPairKey?: ScreenPairKey;
}

export function deriveDescriptorDerivations({
	previous,
	current,
	next,
	ancestorKeys,
	ancestorDestinationPairKey,
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

	const navigationState = current.navigation.getState();
	const routes = navigationState?.routes ?? [];
	const isFirstKey =
		routes.findIndex((route) => route.key === current.route.key) === 0;
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
		ancestorDestinationPairKey,
		parentScreenKey: ancestorKeys[0],
		isFirstKey,
		isTopMostScreen,
		ancestorKeys,
		hasConfiguredInterpolator,
	};
}
