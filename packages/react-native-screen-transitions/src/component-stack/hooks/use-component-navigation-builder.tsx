import * as React from "react";
import { useMemo, useReducer, useRef } from "react";
import type {
	ComponentNavigation,
	ComponentRoute,
	ComponentScreenConfig,
	ComponentScreenProps,
	ComponentStackDescriptor,
	ComponentStackDescriptorMap,
	ComponentStackNavigationOptions,
	ComponentStackState,
} from "../types";

// Generate unique keys for routes
let keyCounter = 0;
const generateKey = () => `component-route-${++keyCounter}`;

// Generate unique key for stack instance
const generateStackKey = () => `component-stack-${Date.now()}`;

type NavigationAction =
	| { type: "PUSH"; name: string; params?: Record<string, unknown> }
	| { type: "POP" }
	| { type: "NAVIGATE"; name: string; params?: Record<string, unknown> }
	| { type: "RESET"; name?: string; params?: Record<string, unknown> };

interface ScreenRegistry {
	[name: string]: ComponentScreenConfig;
}

function createRoute(
	name: string,
	params?: Record<string, unknown>,
): ComponentRoute {
	return {
		key: generateKey(),
		name,
		params,
	};
}

function navigationReducer(
	state: ComponentStackState,
	action: NavigationAction & {
		screens: ScreenRegistry;
		initialRouteName: string;
	},
): ComponentStackState {
	switch (action.type) {
		case "PUSH": {
			if (!action.screens[action.name]) {
				console.warn(
					`[ComponentStack] Screen "${action.name}" not found in navigator`,
				);
				return state;
			}
			const newRoute = createRoute(action.name, action.params);
			return {
				...state,
				routes: [...state.routes, newRoute],
				index: state.routes.length,
			};
		}

		case "POP": {
			if (state.routes.length <= 1) {
				return state;
			}
			return {
				...state,
				routes: state.routes.slice(0, -1),
				index: state.index - 1,
			};
		}

		case "NAVIGATE": {
			if (!action.screens[action.name]) {
				console.warn(
					`[ComponentStack] Screen "${action.name}" not found in navigator`,
				);
				return state;
			}
			// Check if screen already exists in stack
			const existingIndex = state.routes.findIndex(
				(route) => route.name === action.name,
			);
			if (existingIndex !== -1) {
				// Navigate to existing screen (pop to it)
				return {
					...state,
					routes: state.routes.slice(0, existingIndex + 1),
					index: existingIndex,
				};
			}
			// Push new screen
			const newRoute = createRoute(action.name, action.params);
			return {
				...state,
				routes: [...state.routes, newRoute],
				index: state.routes.length,
			};
		}

		case "RESET": {
			const targetName = action.name || action.initialRouteName;
			if (!action.screens[targetName]) {
				console.warn(
					`[ComponentStack] Screen "${targetName}" not found in navigator`,
				);
				return state;
			}
			const newRoute = createRoute(targetName, action.params);
			return {
				...state,
				routes: [newRoute],
				index: 0,
			};
		}

		default:
			return state;
	}
}

interface UseComponentNavigationBuilderOptions {
	children: React.ReactNode;
	initialRouteName?: string;
	screenOptions?: ComponentStackNavigationOptions;
}

interface ComponentNavigationBuilderResult {
	state: ComponentStackState;
	descriptors: ComponentStackDescriptorMap;
	navigation: ComponentNavigation;
}

/**
 * Parse children to extract screen configurations.
 * Expects children to be ComponentScreen elements.
 */
function parseScreens(children: React.ReactNode): ScreenRegistry {
	const screens: ScreenRegistry = {};

	React.Children.forEach(children, (child) => {
		if (!React.isValidElement(child)) {
			return;
		}

		const props = child.props as ComponentScreenProps;
		if (props.name && props.component) {
			screens[props.name] = {
				name: props.name,
				component: props.component,
				options: props.options,
			};
		}
	});

	return screens;
}

export function useComponentNavigationBuilder({
	children,
	initialRouteName,
	screenOptions,
}: UseComponentNavigationBuilderOptions): ComponentNavigationBuilderResult {
	// Parse screen configs from children
	const screens = useMemo(() => parseScreens(children), [children]);

	// Determine initial route
	const screenNames = Object.keys(screens);
	const initialRoute = initialRouteName || screenNames[0];

	if (!initialRoute) {
		throw new Error(
			"[ComponentStack] No screens defined. Add at least one ComponentStack.Screen child.",
		);
	}

	// Stable stack key
	const stackKeyRef = useRef(generateStackKey());

	// Navigation state reducer
	const [state, dispatch] = useReducer(
		(state: ComponentStackState, action: NavigationAction) =>
			navigationReducer(state, {
				...action,
				screens,
				initialRouteName: initialRoute,
			}),
		{
			routes: [createRoute(initialRoute)],
			index: 0,
			key: stackKeyRef.current,
		},
	);

	// Navigation object
	const navigation: ComponentNavigation = useMemo(() => {
		return {
			push: (name: string, params?: Record<string, unknown>) => {
				dispatch({ type: "PUSH", name, params });
			},
			pop: () => {
				dispatch({ type: "POP" });
			},
			goBack: () => {
				dispatch({ type: "POP" });
			},
			navigate: (name: string, params?: Record<string, unknown>) => {
				dispatch({ type: "NAVIGATE", name, params });
			},
			canGoBack: () => state.routes.length > 1,
			reset: (name?: string, params?: Record<string, unknown>) => {
				dispatch({ type: "RESET", name, params });
			},
			index: state.index,
		};
	}, [state.routes.length, state.index]);

	// Build descriptors for each route
	const descriptors = useMemo(() => {
		const result: ComponentStackDescriptorMap = {};

		for (const route of state.routes) {
			const screenConfig = screens[route.name];
			if (!screenConfig) {
				continue;
			}

			const Component = screenConfig.component;
			const mergedOptions: ComponentStackNavigationOptions = {
				...screenOptions,
				...screenConfig.options,
			};

			const descriptor: ComponentStackDescriptor = {
				route,
				navigation,
				options: mergedOptions,
				render: (): React.JSX.Element => (
					<Component navigation={navigation} route={route} />
				),
			};

			result[route.key] = descriptor;
		}

		return result;
	}, [state.routes, screens, screenOptions, navigation]);

	return {
		state,
		descriptors,
		navigation,
	};
}
