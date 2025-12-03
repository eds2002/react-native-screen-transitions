import type { Route } from "@react-navigation/native";
import type { BlankStackDescriptorMap } from "../../../types";

export const composeDescriptors = (
	routes: Route<string>[],
	nextDescriptors: BlankStackDescriptorMap,
	currentDescriptors: BlankStackDescriptorMap,
): BlankStackDescriptorMap => {
	const composed: BlankStackDescriptorMap = {};

	for (const route of routes) {
		const adjusted =
			nextDescriptors[route.key] ?? currentDescriptors[route.key];

		// useScreenAnimation depends on this, however with blank-stack, this should be enabled by default
		const withEnableTransitions = {
			...adjusted,
			options: { ...adjusted.options, enableTransitions: true },
		};
		composed[route.key] = withEnableTransitions;
	}

	return composed;
};
