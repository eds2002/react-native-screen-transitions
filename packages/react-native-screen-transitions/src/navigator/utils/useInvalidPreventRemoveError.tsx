import { usePreventRemoveContext } from "@react-navigation/native";
import * as React from "react";

import type { AwareStackDescriptorMap } from "../types";

export function useInvalidPreventRemoveError(
	descriptors: AwareStackDescriptorMap,
) {
	const { preventedRoutes } = usePreventRemoveContext();
	const preventedRouteKey = Object.keys(preventedRoutes)[0];
	const preventedDescriptor = descriptors[preventedRouteKey];
	const isHeaderBackButtonMenuEnabledOnPreventedScreen =
		preventedDescriptor?.options?.headerBackButtonMenuEnabled;
	const preventedRouteName = preventedDescriptor?.route?.name;

	React.useEffect(() => {
		if (
			preventedRouteKey != null &&
			isHeaderBackButtonMenuEnabledOnPreventedScreen
		) {
			const message =
				`The screen ${preventedRouteName} uses 'usePreventRemove' hook alongside 'headerBackButtonMenuEnabled: true', which is not supported. \n\n` +
				`Consider removing 'headerBackButtonMenuEnabled: true' from ${preventedRouteName} screen to get rid of this error.`;
			console.error(message);
		}
	}, [
		preventedRouteKey,
		isHeaderBackButtonMenuEnabledOnPreventedScreen,
		preventedRouteName,
	]);
}
