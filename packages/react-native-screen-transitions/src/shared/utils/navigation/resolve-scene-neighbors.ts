interface SceneWithKey {
	route: { key: string };
	descriptor: unknown;
}

type IsRouteClosing = (routeKey: string) => boolean;

/**
 * Resolves previous/next descriptors while accounting for routes that are
 * visually closing.
 *
 * Rules:
 * - Closing scenes are isolated (no previous/next) so their transition does not
 *   mix with newly pushed screens.
 * - Non-closing scenes skip over closing neighbors to find the actual active
 *   neighbor.
 * - If there is no non-closing neighbor above/below, we fall back to the first
 *   closing neighbor (needed for normal back transitions).
 */
export function resolveSceneNeighbors<T extends SceneWithKey>(
	scenes: T[],
	sceneIndex: number,
	isRouteClosing: IsRouteClosing,
): {
	previousDescriptor: T["descriptor"] | undefined;
	nextDescriptor: T["descriptor"] | undefined;
} {
	const current = scenes[sceneIndex];
	if (!current) {
		return {
			previousDescriptor: undefined,
			nextDescriptor: undefined,
		};
	}

	if (isRouteClosing(current.route.key)) {
		return {
			previousDescriptor: undefined,
			nextDescriptor: undefined,
		};
	}

	let nextDescriptor: T["descriptor"] | undefined;
	let firstClosingAbove: T["descriptor"] | undefined;

	for (let i = sceneIndex + 1; i < scenes.length; i++) {
		const candidate = scenes[i];
		if (!candidate) continue;

		if (!isRouteClosing(candidate.route.key)) {
			nextDescriptor = candidate.descriptor;
			break;
		}

		if (firstClosingAbove === undefined) {
			firstClosingAbove = candidate.descriptor;
		}
	}

	if (nextDescriptor === undefined) {
		nextDescriptor = firstClosingAbove;
	}

	let previousDescriptor: T["descriptor"] | undefined;
	let firstClosingBelow: T["descriptor"] | undefined;

	for (let i = sceneIndex - 1; i >= 0; i--) {
		const candidate = scenes[i];
		if (!candidate) continue;

		if (!isRouteClosing(candidate.route.key)) {
			previousDescriptor = candidate.descriptor;
			break;
		}

		if (firstClosingBelow === undefined) {
			firstClosingBelow = candidate.descriptor;
		}
	}

	if (previousDescriptor === undefined) {
		previousDescriptor = firstClosingBelow;
	}

	return {
		previousDescriptor,
		nextDescriptor,
	};
}
