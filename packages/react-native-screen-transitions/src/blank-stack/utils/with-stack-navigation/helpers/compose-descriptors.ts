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

		//@ts-expect-error - This option isn't used in blank-stack, however useScreenAnimation requires it, so lets just set it to true.
		adjusted.options.enableTransitions = true;

		composed[route.key] = adjusted;
	}

	return composed;
};
