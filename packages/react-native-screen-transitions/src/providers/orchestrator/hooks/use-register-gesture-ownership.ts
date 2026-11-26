import { useLayoutEffect, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useOptionalBlankStackStore } from "../../../navigators/blank-stack/state/blank-stack.provider";
import {
	type ClaimedDirections,
	NO_CLAIMS,
} from "../../../types/ownership.types";
import { type BaseDescriptor, useBuilderStore } from "../../builder";
import { gestureOwnershipCoordinator } from "../../motion/gestures/ownership/gesture-ownership-coordinator";
import { resolveShadowingClaimDirections } from "../../motion/gestures/ownership/shadowing-claims";
import { resolveScreenGestureConfig } from "../../motion/gestures/shared/policy";
import type {
	GestureOwnerMap,
	ScreenGestureSource,
} from "../../motion/gestures/types";
import { useIsPreloadedScene } from "../../preloaded-scene-context";

const getDescriptorIsFirstKey = (descriptor: BaseDescriptor): boolean => {
	const routes = descriptor.navigation.getState()?.routes ?? [];
	return routes.findIndex((route) => route.key === descriptor.route.key) === 0;
};

const getDescriptorClaimedDirections = (
	descriptor: BaseDescriptor | undefined,
): ClaimedDirections => {
	if (!descriptor) return NO_CLAIMS;

	return resolveScreenGestureConfig({
		options: descriptor.options,
		isFirstKey: getDescriptorIsFirstKey(descriptor),
	}).participation.claimedDirections;
};

export const useRegisterGestureOwnership = ({
	claimedDirections,
	owners,
	source,
}: {
	claimedDirections: ClaimedDirections;
	owners: SharedValue<GestureOwnerMap>;
	source: ScreenGestureSource;
}) => {
	const preloaded = useIsPreloadedScene();
	const previous = useBuilderStore((store) => store.descriptors.previous);
	const isClosing = useOptionalBlankStackStore(
		(store) => store?.scenesByKey[source.routeKey]?.activity === "closing",
	);
	const previousClaimedDirections = useMemo(
		() => getDescriptorClaimedDirections(previous),
		[previous],
	);
	const effectiveClaimedDirections = useMemo(
		() =>
			resolveShadowingClaimDirections({
				isCurrentScreenClosing: isClosing,
				currentClaimedDirections: claimedDirections,
				previousClaimedDirections,
			}),
		[claimedDirections, isClosing, previousClaimedDirections],
	);

	useLayoutEffect(() => {
		if (preloaded) return;
		gestureOwnershipCoordinator.register({
			screenKey: source.routeKey,
			source,
			claimedDirections,
			effectiveClaimedDirections,
			owners,
		});
	}, [
		claimedDirections,
		effectiveClaimedDirections,
		owners,
		preloaded,
		source,
	]);

	useLayoutEffect(() => {
		if (preloaded) return;
		return () => gestureOwnershipCoordinator.unregister(source.routeKey);
	}, [preloaded, source.routeKey]);
};
