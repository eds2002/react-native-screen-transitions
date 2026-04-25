type GestureAncestorNode<T> = {
	gestureContext: T | null;
};

/**
 * Returns the gesture context chain, starting at `context`, then walking upward.
 */
export function walkGestureAncestors<T extends GestureAncestorNode<T>>(
	context: T | null | undefined,
): T[] {
	const ancestors: T[] = [];
	let ancestor = context ?? null;

	while (ancestor) {
		ancestors.push(ancestor);
		ancestor = ancestor.gestureContext;
	}

	return ancestors;
}
