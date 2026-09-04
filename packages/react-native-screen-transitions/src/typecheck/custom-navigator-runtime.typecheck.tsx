import {
	createStandardNavigationFactories,
	type StackActionHelpers,
	type StackNavigationState,
	StackRouter,
	type StackRouterOptions,
	type StandardNavigationTypeBagBase,
} from "@react-navigation/native";
import { Fragment } from "react";
import { createStandardNavigator } from "standard-navigation";
import {
	BlankStackHost,
	type BlankStackNavigationEventMap,
	type BlankStackNavigationOptions,
	BlankStackRuntime,
	BlankStackScene,
	type BlankStackStandardNavigatorProps,
	useBlankStackState,
	useStackTransition,
} from "../custom-navigator";

function AlternateStackView() {
	const { routeKeys } = useBlankStackState();
	const transition = useStackTransition();

	if (transition) {
		void transition.source.route.key;
		void transition.target.route.key;
		void transition.driver.route.key;
		void transition.direction;
		void transition.progress;
	}

	return (
		<Fragment>
			{routeKeys.map((routeKey) => (
				<BlankStackScene key={routeKey} routeKey={routeKey} />
			))}
		</Fragment>
	);
}

const AlternateStackNavigator = createStandardNavigator<
	BlankStackNavigationOptions,
	BlankStackNavigationEventMap,
	BlankStackStandardNavigatorProps
>(({ descriptors, navigation, navigationState }) => {
	if (!navigationState || !navigation) {
		throw new Error("AlternateStack requires mapped stack state and helpers.");
	}

	return (
		<BlankStackRuntime
			state={navigationState}
			navigation={navigation}
			descriptors={descriptors}
		>
			<BlankStackHost>
				<AlternateStackView />
			</BlankStackHost>
		</BlankStackRuntime>
	);
});

interface AlternateStackTypeBag extends StandardNavigationTypeBagBase {
	State: StackNavigationState<this["ParamList"]>;
	ActionHelpers: StackActionHelpers<this["ParamList"]>;
	ScreenOptions: BlankStackNavigationOptions;
	EventMap: BlankStackNavigationEventMap;
	RouterOptions: StackRouterOptions;
}

createStandardNavigationFactories<
	AlternateStackTypeBag,
	BlankStackStandardNavigatorProps
>(AlternateStackNavigator, StackRouter, ({ state, navigation }) => ({
	navigationState: state,
	navigation,
}));
