import { createScreenPairKey } from "../../../../stores/bounds/helpers/link-pairs.helpers";
import type { ScreenPairKey } from "../../../../stores/bounds/types";
import type { BaseStackDescriptor } from "../../../../types/stack.types";

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
}

export function deriveDescriptorDerivations({
	previous,
	current,
	next,
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
		isFirstKey,
		isTopMostScreen,
		hasConfiguredInterpolator,
	};
}
