import { useLayoutEffect, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import {
	type ClaimedDirections,
	NO_CLAIMS,
} from "../../../../types/ownership.types";
import { useBlankStackStore } from "../../../stack/blank-stack.provider";
import { type BaseDescriptor, useBuilderStore } from "../../builder";
import { gestureOwnershipCoordinator } from "../../motion/gestures/ownership/gesture-ownership-coordinator";
import { resolveShadowingClaimDirections } from "../../motion/gestures/ownership/shadowing-claims";
import { resolveScreenGestureConfig } from "../../motion/gestures/shared/policy";
import type {
	GestureOwnerMap,
	ScreenGestureSource,
} from "../../motion/gestures/types";

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
	const previous = useBuilderStore((store) => store.descriptors.previous);
	const isClosing = useBlankStackStore(
		(store) => store.scenesByKey[source.routeKey]?.activity === "closing",
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
		gestureOwnershipCoordinator.register({
			screenKey: source.routeKey,
			source,
			claimedDirections,
			effectiveClaimedDirections,
			owners,
		});
	}, [claimedDirections, effectiveClaimedDirections, owners, source]);

	useLayoutEffect(
		() => () => {
			gestureOwnershipCoordinator.unregister(source.routeKey);
		},
		[source.routeKey],
	);
};
