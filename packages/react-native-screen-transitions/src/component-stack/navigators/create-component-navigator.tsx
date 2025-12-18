import * as React from "react";
import type { ManagedStackProps } from "../../shared/providers/stack/managed.provider";
import { ComponentView } from "../components/component-view";
import { useComponentNavigationBuilder } from "../hooks/use-component-navigation-builder";
import type {
	ComponentNavigation,
	ComponentNavigatorProps,
	ComponentScreenProps,
} from "../types";

// Context for component navigation
const ComponentNavigationContext =
	React.createContext<ComponentNavigation | null>(null);

export function useComponentNavigationContext(): ComponentNavigation {
	const context = React.useContext(ComponentNavigationContext);
	if (!context) {
		throw new Error(
			"useComponentNavigation must be used within a ComponentStack.Navigator",
		);
	}
	return context;
}

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
	const { state, navigation, describe, descriptors, NavigationContent } =
		useComponentNavigationBuilder({
			children,
			initialRouteName,
			screenOptions,
		});

	// Type assertion: component-stack types are compatible with ManagedStackProps
	// but TypeScript doesn't know this due to different type definitions
	const managedStackProps = {
		state,
		navigation,
		describe,
		descriptors,
	} as unknown as ManagedStackProps;

	return (
		<ComponentNavigationContext.Provider value={navigation}>
			<NavigationContent>
				<ComponentView {...managedStackProps} />
			</NavigationContent>
		</ComponentNavigationContext.Provider>
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
