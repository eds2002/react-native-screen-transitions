import * as React from "react";
import { ComponentView } from "../components/component-view";
import { useComponentNavigationBuilder } from "../hooks/use-component-navigation-builder";
import type {
	ComponentNavigatorProps,
	ComponentScreenProps,
	ComponentStackNavigationOptions,
	ComponentStackScreenProps,
} from "../types";

/**
 * Screen component for defining screens in a ComponentNavigator.
 * This is a configuration component - it doesn't render anything itself.
 */
function ComponentScreen(_props: ComponentScreenProps): null {
	return null;
}

/**
 * Navigator component that manages internal component navigation.
 * Does not affect React Navigation or Expo Router routes.
 */
function ComponentNavigator({
	children,
	initialRouteName,
	screenOptions,
}: ComponentNavigatorProps) {
	const { state, descriptors, navigation } = useComponentNavigationBuilder({
		children,
		initialRouteName,
		screenOptions,
	});

	return (
		<ComponentView
			state={state}
			descriptors={descriptors}
			navigation={navigation}
		/>
	);
}

interface ComponentStack {
	Navigator: React.FC<ComponentNavigatorProps>;
	Screen: React.FC<ComponentScreenProps>;
}

/**
 * Creates a component navigation stack.
 *
 * @example
 * ```tsx
 * const Stack = createComponentNavigator();
 *
 * function MyComponent() {
 *   return (
 *     <Stack.Navigator initialRouteName="Home">
 *       <Stack.Screen
 *         name="Home"
 *         component={HomeScreen}
 *         options={{ ...SlideFromBottom() }}
 *       />
 *       <Stack.Screen
 *         name="Details"
 *         component={DetailsScreen}
 *         options={{ ...SlideFromBottom() }}
 *       />
 *     </Stack.Navigator>
 *   );
 * }
 * ```
 */
export function createComponentNavigator(): ComponentStack {
	return {
		Navigator: ComponentNavigator,
		Screen: ComponentScreen,
	};
}

