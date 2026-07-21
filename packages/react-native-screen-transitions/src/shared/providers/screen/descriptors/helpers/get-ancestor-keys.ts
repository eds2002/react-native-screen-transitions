import { createScreenPairKey } from "../../../../stores/bounds/helpers/link-pairs.helpers";
import type { ScreenPairKey } from "../../../../stores/bounds/types";
import type { BaseStackDescriptor } from "../../../../types/stack.types";

export interface AncestorKeyState {
	ancestorKeys: string[];
	ancestorDestinationPairKey?: ScreenPairKey;
}

/**
 * Builds nested navigator ancestor keys from immediate parent to root.
 * The nearest ancestor destination pair lets child routes attach measurements
 * to the transition owned by the parent stack.
 */
export function getAncestorKeyState(
	current: BaseStackDescriptor,
): AncestorKeyState {
	const ancestors: string[] = [];
	let ancestorDestinationPairKey: ScreenPairKey | undefined;
	const nav = current.navigation as any;

	if (typeof nav?.getParent !== "function") {
		return { ancestorKeys: ancestors };
	}

	let parent = nav.getParent();

	while (parent) {
		const state = parent.getState();
		if (state?.routes && state.index !== undefined) {
			const focusedRoute = state.routes[state.index];
			if (focusedRoute?.key) {
				ancestors.push(focusedRoute.key);

				const previousRoute = state.routes[state.index - 1];
				if (!ancestorDestinationPairKey && previousRoute?.key) {
					ancestorDestinationPairKey = createScreenPairKey(
						previousRoute.key,
						focusedRoute.key,
					);
				}
			}
		}
		parent = parent.getParent();
	}

	return {
		ancestorKeys: ancestors,
		ancestorDestinationPairKey,
	};
}

export function getAncestorKeys(current: BaseStackDescriptor): string[] {
	return getAncestorKeyState(current).ancestorKeys;
}
