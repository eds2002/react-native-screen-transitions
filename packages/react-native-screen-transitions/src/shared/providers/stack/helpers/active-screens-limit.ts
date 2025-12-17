import type { NavigationRoute, ParamListBase } from "@react-navigation/native";
import type { BlankStackDescriptorMap } from "../../../../blank-stack/types";

export function calculateActiveScreensLimit(
	routes: NavigationRoute<ParamListBase, string>[],
	descriptors: BlankStackDescriptorMap,
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
