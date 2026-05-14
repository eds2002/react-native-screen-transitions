type GestureAncestorNode<T> = {
	gestureContext: T | null;
	isIsolated?: boolean;
};

/**
 * Returns the gesture context chain, starting at `context`, then walking upward.
 * When `isIsolated` is provided, the walk stops at a stack isolation boundary.
 */
export function walkGestureAncestors<T extends GestureAncestorNode<T>>(
	context: T | null | undefined,
	isIsolated?: boolean,
): T[] {
	const ancestors: T[] = [];
	let ancestor = context ?? null;

	while (ancestor) {
		if (isIsolated !== undefined && ancestor.isIsolated !== isIsolated) {
			break;
		}

		ancestors.push(ancestor);
		ancestor = ancestor.gestureContext;
	}

	return ancestors;
}
