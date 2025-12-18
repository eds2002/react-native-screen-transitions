import * as React from "react";
import { useCallback, useMemo, useReducer, useRef } from "react";
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
	| { type: "POP_BY_KEY"; key: string }
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

		case "POP_BY_KEY": {
			const routeIndex = state.routes.findIndex(
				(route) => route.key === action.key,
			);
			if (routeIndex === -1) {
				// Route not found, nothing to do
				return state;
			}
			if (state.routes.length <= 1) {
				// Can't pop the last route
				return state;
			}
			const nextRoutes = state.routes.filter(
				(route) => route.key !== action.key,
			);
			return {
				...state,
				routes: nextRoutes,
				index: Math.min(state.index, nextRoutes.length - 1),
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
	navigation: ComponentNavigation;
	describe: (
		route: ComponentRoute,
		placeholder: boolean,
	) => ComponentStackDescriptor;
	descriptors: ComponentStackDescriptorMap;
	NavigationContent: React.FC<{ children: React.ReactNode }>;
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
	const [state, internalDispatch] = useReducer(
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

	// Dispatch method that handles both internal actions and StackActions format
	const dispatch = useCallback(
		(
			action:
				| NavigationAction
				| { type: string; source?: string; target?: string; payload?: unknown },
		) => {
			// Handle StackActions.pop() format from useLocalRoutes: { type: 'POP', source: routeKey }
			if (
				action.type === "POP" &&
				"source" in action &&
				typeof action.source === "string"
			) {
				internalDispatch({ type: "POP_BY_KEY", key: action.source });
				return;
			}

			// Handle standard internal actions
			switch (action.type) {
				case "PUSH":
					if ("name" in action && typeof action.name === "string") {
						internalDispatch({
							type: "PUSH",
							name: action.name,
							params: action.params as Record<string, unknown> | undefined,
						});
					}
					break;
				case "POP":
					internalDispatch({ type: "POP" });
					break;
				case "NAVIGATE":
					if ("name" in action && typeof action.name === "string") {
						internalDispatch({
							type: "NAVIGATE",
							name: action.name,
							params: action.params as Record<string, unknown> | undefined,
						});
					}
					break;
				case "RESET":
					internalDispatch({
						type: "RESET",
						name:
							"name" in action
								? (action.name as string | undefined)
								: undefined,
						params:
							"params" in action
								? (action.params as Record<string, unknown> | undefined)
								: undefined,
					});
					break;
				case "POP_BY_KEY":
					if ("key" in action && typeof action.key === "string") {
						internalDispatch({ type: "POP_BY_KEY", key: action.key });
					}
					break;
			}
		},
		[],
	);

	// Ref for getState to always return latest state
	const stateRef = useRef(state);
	stateRef.current = state;

	// Navigation object
	const navigation: ComponentNavigation = useMemo(() => {
		return {
			push: (name: string, params?: Record<string, unknown>) => {
				internalDispatch({ type: "PUSH", name, params });
			},
			pop: () => {
				internalDispatch({ type: "POP" });
			},
			goBack: () => {
				internalDispatch({ type: "POP" });
			},
			navigate: (name: string, params?: Record<string, unknown>) => {
				internalDispatch({ type: "NAVIGATE", name, params });
			},
			canGoBack: () => stateRef.current.routes.length > 1,
			reset: (name?: string, params?: Record<string, unknown>) => {
				internalDispatch({ type: "RESET", name, params });
			},
			dispatch,
			getState: () => stateRef.current,
			index: state.index,
		};
	}, [state.index, dispatch]);

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

	// Describe function: creates a descriptor for a route (used for placeholder screens)
	const describe = useCallback(
		(route: ComponentRoute, placeholder: boolean): ComponentStackDescriptor => {
			const screenConfig = screens[route.name];
			const mergedOptions: ComponentStackNavigationOptions = {
				...screenOptions,
				...screenConfig?.options,
			};

			const Component = screenConfig?.component;

			return {
				route,
				navigation,
				options: mergedOptions,
				render: (): React.JSX.Element | null =>
					placeholder || !Component ? null : (
						<Component navigation={navigation} route={route} />
					),
			};
		},
		[screens, screenOptions, navigation],
	);

	// NavigationContent wrapper (simple pass-through for component-stack)
	const NavigationContent = useCallback(
		({ children }: { children: React.ReactNode }) => {
			return <>{children}</>;
		},
		[],
	);

	return {
		state,
		navigation,
		describe,
		descriptors,
		NavigationContent,
	};
}
