import type { BaseStackDescriptor } from "../../../../types/stack.types";

/**
 * Builds the parent navigator key chain for nested navigators.
 * Returns keys from immediate parent navigator to root navigator.
 */
export function getAncestorNavigatorKeys(
	current: BaseStackDescriptor,
): string[] {
	const ancestors: string[] = [];
	const nav = current.navigation as any;

	if (typeof nav?.getParent !== "function") {
		return ancestors;
	}

	let parent = nav.getParent();

	while (parent) {
		const state = parent.getState?.();
		const key = state?.key;
		if (typeof key === "string") {
			ancestors.push(key);
		}
		parent = parent.getParent?.();
	}

	return ancestors;
}
