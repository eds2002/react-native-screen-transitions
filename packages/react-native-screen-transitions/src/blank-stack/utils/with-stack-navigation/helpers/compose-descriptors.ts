import type { Route } from "@react-navigation/native";
import type { BlankStackDescriptorMap } from "../../../types";

export const composeDescriptors = (
	routes: Route<string>[],
	nextDescriptors: BlankStackDescriptorMap,
	currentDescriptors: BlankStackDescriptorMap,
): BlankStackDescriptorMap => {
	const composed: BlankStackDescriptorMap = {};

	for (const route of routes) {
		composed[route.key] =
			nextDescriptors[route.key] ?? currentDescriptors[route.key];
	}

	return composed;
};
