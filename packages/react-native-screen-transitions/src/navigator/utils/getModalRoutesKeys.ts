import type { Route } from "@react-navigation/native";

import type { AwareStackDescriptorMap } from "../types";

export const getModalRouteKeys = (
	routes: Route<string>[],
	descriptors: AwareStackDescriptorMap,
) =>
	routes.reduce<string[]>((acc, route) => {
		const { presentation } = descriptors[route.key]?.options ?? {};

		if (
			(acc.length && !presentation) ||
			presentation === "modal" ||
			presentation === "transparentModal"
		) {
			acc.push(route.key);
		}

		return acc;
	}, []);
