import type {
	BaseStackDescriptor,
	BaseStackRoute,
} from "../../../types/stack.types";

type DescriptorWithDetach = BaseStackDescriptor & {
	options: { detachPreviousScreen?: boolean };
};

export function calculateActiveScreensLimit(
	routes: BaseStackRoute[],
	descriptors: Record<string, DescriptorWithDetach>,
): number {
	if (routes.length === 0) {
		return 1;
	}

	let limit = 1;

	for (let i = routes.length - 1; i >= 0; i--) {
		const route = routes[i];

		const shouldKeepPrevious =
			descriptors?.[route.key]?.options?.detachPreviousScreen !== true;

		if (shouldKeepPrevious) {
			limit++;
			continue;
		}

		break;
	}

	return Math.min(limit, routes.length);
}
