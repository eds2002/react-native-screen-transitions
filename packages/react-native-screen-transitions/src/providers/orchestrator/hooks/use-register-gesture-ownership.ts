import { useLayoutEffect, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import {
	type ClaimedDirections,
	NO_CLAIMS,
} from "../../../types/ownership.types";
import { type BaseDescriptor, useBuilderStore } from "../../builder";
import { useOptionalScreenHostStore } from "../../host/screen-host.provider";
import { gestureOwnershipCoordinator } from "../../motion/gestures/ownership/gesture-ownership-coordinator";
import { resolveShadowingClaimDirections } from "../../motion/gestures/ownership/shadowing-claims";
import { resolveScreenGestureConfig } from "../../motion/gestures/shared/policy";
import type {
	GestureOwnerMap,
	ScreenGestureSource,
} from "../../motion/gestures/types";

const getDescriptorClaimedDirections = (
	descriptor: BaseDescriptor | undefined,
	firstRouteKey: string | undefined,
): ClaimedDirections => {
	if (!descriptor) return NO_CLAIMS;

	return resolveScreenGestureConfig({
		options: descriptor.options,
		isFirstKey:
			firstRouteKey !== undefined && descriptor.route.key === firstRouteKey,
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
	const isClosing = useOptionalScreenHostStore(
		(store) => store?.scenesByKey[source.routeKey]?.activity === "closing",
	);
	const firstRouteKey = useOptionalScreenHostStore(
		(store) => store?.firstRouteKey,
	);
	const previousClaimedDirections = useMemo(
		() => getDescriptorClaimedDirections(previous, firstRouteKey),
		[previous, firstRouteKey],
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
