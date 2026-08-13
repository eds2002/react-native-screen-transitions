import { useLayoutEffect, useMemo } from "react";
import { GestureStore } from "../../../../stores/gesture.store";
import {
	type ClaimedDirections,
	DIRECTIONS,
	type Direction,
	NO_CLAIMS,
} from "../../../../types/ownership.types";
import {
	type BaseDescriptor,
	useDescriptorsStore,
} from "../../../screen/descriptors";
import { useOptionalBlankStackStore } from "../../../stack/blank-stack.provider";
import { useScreenGestureStore } from "../gestures.provider";
import { resolveScreenGestureConfig } from "../shared/policy";
import type { ScreenGestureSource } from "../types";
import { resolveShadowingClaimDirections } from "./shadowing-claims";

type ShadowedAncestor = {
	ancestor: ScreenGestureSource;
	directions: Direction[];
};

const NO_SHADOWED_ANCESTORS: ShadowedAncestor[] = [];

const findShadowedDirections = (
	claimedDirections: ClaimedDirections,
	ancestorDirections: ClaimedDirections,
) => {
	const shadowedDirections: Direction[] = [];

	for (const direction of DIRECTIONS) {
		if (claimedDirections[direction] && ancestorDirections[direction]) {
			shadowedDirections.push(direction);
		}
	}

	return shadowedDirections;
};

const findShadowedAncestors = (
	ancestorGestures: readonly ScreenGestureSource[],
	claimedDirections: ClaimedDirections,
) => {
	if (ancestorGestures.length === 0) {
		return NO_SHADOWED_ANCESTORS;
	}

	const ancestors: ShadowedAncestor[] = [];
	for (const ancestor of ancestorGestures) {
		const directions = findShadowedDirections(
			claimedDirections,
			ancestor.claimedDirections,
		);

		if (directions.length > 0) {
			ancestors.push({ ancestor, directions });
		}
	}

	return ancestors.length ? ancestors : NO_SHADOWED_ANCESTORS;
};

const registerShadowingClaims = (
	shadowedAncestors: ShadowedAncestor[],
	currentScreenKey: string,
) => {
	const isDismissing = GestureStore.getValue(currentScreenKey, "dismissing");

	for (const { ancestor, directions } of shadowedAncestors) {
		const newClaims = { ...ancestor.childDirectionClaims.get() };
		for (const direction of directions) {
			newClaims[direction] = { routeKey: currentScreenKey, isDismissing };
		}
		ancestor.childDirectionClaims.set(newClaims);
	}
};

const clearShadowingClaims = (
	shadowedAncestors: ShadowedAncestor[],
	currentScreenKey: string,
) => {
	for (const { ancestor, directions } of shadowedAncestors) {
		const currentClaims = ancestor.childDirectionClaims.get();
		const newClaims = { ...currentClaims };
		let needsUpdate = false;

		for (const direction of directions) {
			if (currentClaims[direction]?.routeKey === currentScreenKey) {
				newClaims[direction] = null;
				needsUpdate = true;
			}
		}

		if (needsUpdate) {
			ancestor.childDirectionClaims.set(newClaims);
		}
	}
};

const getDescriptorIsFirstKey = (descriptor: BaseDescriptor): boolean => {
	const navigationState = descriptor.navigation.getState();
	const routes = navigationState?.routes ?? [];
	return routes.findIndex((route) => route.key === descriptor.route.key) === 0;
};

const getDescriptorClaimedDirections = (
	descriptor: BaseDescriptor | undefined,
	ancestorGestures: readonly ScreenGestureSource[],
): ClaimedDirections => {
	if (!descriptor) {
		return NO_CLAIMS;
	}

	return resolveScreenGestureConfig({
		options: descriptor.options,
		isFirstKey: getDescriptorIsFirstKey(descriptor),
		ancestorGestures,
	}).participation.claimedDirections;
};

function ActiveGestureOwnershipBridge() {
	const gestureContext = useScreenGestureStore();
	const previous = useDescriptorsStore((store) => store.previous);
	const isCurrentScreenClosing = useOptionalBlankStackStore(
		(store) =>
			store?.scenesByKey[gestureContext.routeKey]?.activity === "closing",
	);
	const {
		claimedDirections,
		ancestorGestures,
		routeKey: currentScreenKey,
	} = gestureContext;
	const effectiveClaimedDirections = useMemo(
		() =>
			resolveShadowingClaimDirections({
				isCurrentScreenClosing,
				currentClaimedDirections: claimedDirections,
				previousClaimedDirections: getDescriptorClaimedDirections(
					previous,
					ancestorGestures,
				),
			}),
		[isCurrentScreenClosing, claimedDirections, previous, ancestorGestures],
	);
	const shadowedAncestors = useMemo(
		() => findShadowedAncestors(ancestorGestures, effectiveClaimedDirections),
		[ancestorGestures, effectiveClaimedDirections],
	);

	useLayoutEffect(() => {
		if (!shadowedAncestors.length) {
			return;
		}

		registerShadowingClaims(shadowedAncestors, currentScreenKey);

		return () => {
			clearShadowingClaims(shadowedAncestors, currentScreenKey);
		};
	}, [shadowedAncestors, currentScreenKey]);

	return null;
}

/** Keeps gesture ownership subscriptions attached only to participating screens. */
export function GestureOwnershipBridge() {
	const isTopMostScreen = useDescriptorsStore(
		(store) => store.derivations.isTopMostScreen,
	);

	return isTopMostScreen ? <ActiveGestureOwnershipBridge /> : null;
}
