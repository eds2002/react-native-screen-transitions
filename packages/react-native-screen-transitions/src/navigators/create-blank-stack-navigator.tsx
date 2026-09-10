import { createStandardNavigator } from "standard-navigation";
import { BlankStackView } from "../components/screen/view";
import type { BlankStackNavigationOptions } from "../types/blank-stack.types";
import type {
	BaseStackNavigation,
	BaseStackRoute,
	BaseStackState,
} from "../types/stack.types";

export type BlankStackStandardEventMap = {};

export type BlankStackStandardNavigatorProps = {
	navigationState?: BaseStackState<BaseStackRoute>;
	navigation?: BaseStackNavigation;
};

export const BlankStackNavigator = createStandardNavigator<
	BlankStackNavigationOptions,
	BlankStackStandardEventMap,
	BlankStackStandardNavigatorProps
>(({ descriptors, navigation, navigationState }) => {
	if (!navigationState || !navigation) {
		throw new Error(
			"BlankStack requires navigation state and helpers from its integration.",
		);
	}

	return (
		<BlankStackView
			state={navigationState}
			navigation={navigation}
			descriptors={descriptors}
		/>
	);
});
