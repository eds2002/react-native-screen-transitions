interface SceneWithKey {
	route: { key: string };
	descriptor: unknown;
}

type IsRouteClosing = (routeKey: string) => boolean;

const findPreviousDescriptor = <T extends SceneWithKey>(
	scenes: T[],
	sceneIndex: number,
	isRouteClosing: IsRouteClosing,
): T["descriptor"] | undefined => {
	let firstClosingBelow: T["descriptor"] | undefined;

	for (let i = sceneIndex - 1; i >= 0; i--) {
		const candidate = scenes[i];
		if (!candidate) continue;

		if (!isRouteClosing(candidate.route.key)) {
			return candidate.descriptor;
		}

		if (firstClosingBelow === undefined) {
			firstClosingBelow = candidate.descriptor;
		}
	}

	return firstClosingBelow;
};

/**
 * Resolves previous/next descriptors while accounting for routes that are
 * visually closing.
 *
 * Rules:
 * - Closing scenes keep their previous descriptor so their original pair can
 *   keep resolving while they remain mounted, but they never receive a next
 *   descriptor.
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
			previousDescriptor: findPreviousDescriptor(
				scenes,
				sceneIndex,
				isRouteClosing,
			),
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

	const previousDescriptor = findPreviousDescriptor(
		scenes,
		sceneIndex,
		isRouteClosing,
	);

	return {
		previousDescriptor,
		nextDescriptor,
	};
}
