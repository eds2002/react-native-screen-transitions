import type { BaseStackDescriptor } from "../../../../types/stack.types";

/**
 * Builds nested navigator ancestor keys from immediate parent to root.
 */
export function getAncestorKeys(current: BaseStackDescriptor): string[] {
	const ancestors: string[] = [];
	const nav = current.navigation as any;

	if (typeof nav?.getParent !== "function") {
		return ancestors;
	}

	let parent = nav.getParent();

	while (parent) {
		const state = parent.getState();
		if (state?.routes && state.index !== undefined) {
			const focusedRoute = state.routes[state.index];
			if (focusedRoute?.key) {
				ancestors.push(focusedRoute.key);
			}
		}
		parent = parent.getParent();
	}

	return ancestors;
}
