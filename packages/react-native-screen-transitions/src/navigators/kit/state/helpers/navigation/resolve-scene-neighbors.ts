interface SceneWithKey {
	route: { key: string };
	descriptor: unknown;
}

type IsRouteClosing = (routeKey: string) => boolean;
type GetRouteClosingOrder = (routeKey: string) => number | undefined;

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
 * - A closing scene between a scene and its non-closing next (a push that landed
 *   during a close) is returned as closingNextDescriptor.
 */
export function resolveSceneNeighbors<T extends SceneWithKey>(
	scenes: T[],
	sceneIndex: number,
	isRouteClosing: IsRouteClosing,
	getRouteClosingOrder?: GetRouteClosingOrder,
): {
	previousDescriptor: T["descriptor"] | undefined;
	nextDescriptor: T["descriptor"] | undefined;
	closingNextDescriptor?: T["descriptor"];
} {
	const current = scenes[sceneIndex];
	if (!current) {
		return {
			previousDescriptor: undefined,
			nextDescriptor: undefined,
		};
	}

	if (isRouteClosing(current.route.key)) {
		// The screen right above may still be on its way out (a second pop landed during the first):
		// it still covers this one, which keeps following it, or it would drop to uncovered in one
		// frame as its own close starts. A screen pushed above it since is not its next.
		const above = scenes[sceneIndex + 1];
		return {
			previousDescriptor: findPreviousDescriptor(
				scenes,
				sceneIndex,
				isRouteClosing,
			),
			nextDescriptor:
				above && isRouteClosing(above.route.key) ? above.descriptor : undefined,
		};
	}

	let nextDescriptor: T["descriptor"] | undefined;
	let latestClosingAbove: T["descriptor"] | undefined;
	let latestClosingAboveOrder = Number.NEGATIVE_INFINITY;

	for (let i = sceneIndex + 1; i < scenes.length; i++) {
		const candidate = scenes[i];
		if (!candidate) continue;

		if (!isRouteClosing(candidate.route.key)) {
			nextDescriptor = candidate.descriptor;
			break;
		}

		const closeOrder = getRouteClosingOrder?.(candidate.route.key) ?? i;
		if (closeOrder >= latestClosingAboveOrder) {
			latestClosingAbove = candidate.descriptor;
			latestClosingAboveOrder = closeOrder;
		}
	}

	let closingNextDescriptor: T["descriptor"] | undefined;
	if (nextDescriptor === undefined) {
		nextDescriptor = latestClosingAbove;
	} else {
		closingNextDescriptor = latestClosingAbove;
	}

	const previousDescriptor = findPreviousDescriptor(
		scenes,
		sceneIndex,
		isRouteClosing,
	);

	return {
		previousDescriptor,
		nextDescriptor,
		closingNextDescriptor,
	};
}
