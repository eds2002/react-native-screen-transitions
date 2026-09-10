import type { ScreenTransitionConfig } from "./screen.types";

export type StackTransitionOptions = ScreenTransitionConfig;

/**
 * Minimal route shape for navigation utilities.
 * Used as a generic constraint across route comparison functions.
 */
export interface RouteWithKey {
	key: string;
}

/**
 * Minimal route contract shared by BlankStack and the native-stack adapter.
 * Uses `object` for params to be compatible with React Navigation's `Readonly<object | undefined>`.
 */
export interface BaseStackRoute {
	key: string;
	name: string;
	params?: object;
}

export type StackSceneActivity = "active" | "inert" | "inactive" | "closing";

/**
 * Minimal navigation contract used by transition lifecycle code.
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
 * Descriptor contract consumed by the shared transition renderer.
 */
export interface BaseStackDescriptor<
	TRoute extends BaseStackRoute = BaseStackRoute,
	TNavigation extends BaseStackNavigation = BaseStackNavigation,
> {
	route: TRoute;
	navigation: TNavigation;
	options: StackTransitionOptions;
	render?: () => React.JSX.Element | null;
}

/**
 * Route and descriptor pair consumed by the shared transition renderer.
 */
export interface BaseStackScene<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
> {
	activity: StackSceneActivity;
	route: TDescriptor["route"];
	descriptor: TDescriptor;
	previousDescriptor?: TDescriptor;
	nextDescriptor?: TDescriptor;
}

/**
 * Minimal navigation state accepted by BlankStack.
 */
export interface BaseStackState<
	TRoute extends BaseStackRoute = BaseStackRoute,
> {
	routes: TRoute[];
	index: number;
	key: string;
}
