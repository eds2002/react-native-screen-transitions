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
import { useBlankStackStore } from "../../../stack/blank-stack.provider";
import { useGestureStore } from "../gestures.provider";
import { walkGestureAncestors } from "../shared/ancestors";
import { resolveScreenGestureConfig } from "../shared/policy";
import type { GestureContextType } from "../types";
import { resolveShadowingClaimDirections } from "./shadowing-claims";

type ShadowedAncestor = {
	ancestor: GestureContextType;
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
	parentContext: GestureContextType | null,
	claimedDirections: ClaimedDirections,
) => {
	if (!parentContext) {
		return NO_SHADOWED_ANCESTORS;
	}

	const ancestors: ShadowedAncestor[] = [];
	for (const ancestor of walkGestureAncestors(parentContext)) {
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
	gestureContext: GestureContextType | null,
): ClaimedDirections => {
	if (!descriptor) {
		return NO_CLAIMS;
	}

	return resolveScreenGestureConfig({
		options: descriptor.options,
		isFirstKey: getDescriptorIsFirstKey(descriptor),
		gestureContext,
	}).participation.claimedDirections;
};

const requireGestureContext = (
	gestureContext: GestureContextType | null,
): GestureContextType => {
	if (!gestureContext) {
		throw new Error(
			"GestureOwnershipBridge must be rendered within a ScreenGestureProvider",
		);
	}

	return gestureContext;
};

function ActiveGestureOwnershipBridge() {
	const gestureContext = requireGestureContext(useGestureStore());
	const previous = useDescriptorsStore((store) => store.previous);
	const isCurrentScreenClosing = useBlankStackStore(
		(store) =>
			store?.scenesByKey[gestureContext.routeKey]?.activity === "closing",
	);
	const {
		claimedDirections,
		gestureContext: parentContext,
		routeKey: currentScreenKey,
	} = gestureContext;
	// A retained closing screen cannot receive touches, so its ownership must
	// mirror the visible screen underneath instead of blocking an ancestor.
	const effectiveClaimedDirections = useMemo(
		() =>
			resolveShadowingClaimDirections({
				isCurrentScreenClosing,
				currentClaimedDirections: claimedDirections,
				previousClaimedDirections: getDescriptorClaimedDirections(
					previous,
					parentContext,
				),
			}),
		[isCurrentScreenClosing, claimedDirections, previous, parentContext],
	);
	const shadowedAncestors = useMemo(
		() => findShadowedAncestors(parentContext, effectiveClaimedDirections),
		[parentContext, effectiveClaimedDirections],
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
