import type { ScreenTransitionConfig } from "./screen.types";

/**
 * Minimal route shape for navigation utilities.
 * Used as a generic constraint across route comparison functions.
 */
export interface RouteWithKey {
	key: string;
}

/**
 * Base route interface - minimal contract all stacks satisfy.
 * Uses `object` for params to be compatible with React Navigation's `Readonly<object | undefined>`.
 */
export interface BaseStackRoute {
	key: string;
	name: string;
	params?: object;
}

export type StackSceneActivity = "active" | "inert" | "inactive" | "closing";

/**
 * Base navigation interface - minimal contract for gesture handling.
 * React Navigation helpers satisfy this.
 */
export interface BaseStackNavigation {
	getState: () => {
		routes: Array<{ key: string }>;
		key: string;
		index: number;
	};
	dispatch: (action: any) => void;
	addListener?: (event: any, callback: any) => () => void;
	emit?: (event: any) => any;
}

/**
 * Base descriptor interface - generic over route, navigation, and options.
 * All stack descriptors extend this.
 */
export interface BaseStackDescriptor<
	TRoute extends BaseStackRoute = BaseStackRoute,
	TNavigation extends BaseStackNavigation = BaseStackNavigation,
	TOptions extends ScreenTransitionConfig = ScreenTransitionConfig,
> {
	route: TRoute;
	navigation: TNavigation;
	options: TOptions;
	activity: StackSceneActivity;
	render?: () => React.JSX.Element | null;
}

export type StackDescriptorSource<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
> = Omit<TDescriptor, "activity"> & {
	activity?: StackSceneActivity;
};

/**
 * Base scene interface - route + descriptor pair.
 * Used by all stack views to iterate over screens.
 */
export interface BaseStackScene<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
> {
	route: TDescriptor["route"];
	descriptor: TDescriptor;
	previousDescriptor?: TDescriptor;
	nextDescriptor?: TDescriptor;
}

/**
 * Base state interface - routes array with index.
 * Common structure across all navigation states.
 */
export interface BaseStackState<
	TRoute extends BaseStackRoute = BaseStackRoute,
> {
	routes: TRoute[];
	index: number;
	key: string;
}

/**
 * Generic descriptor map - keyed by route key.
 * Use this instead of defining stack-specific DescriptorMap types.
 */
export type DescriptorMap<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
> = {
	[key: string]: TDescriptor;
};
