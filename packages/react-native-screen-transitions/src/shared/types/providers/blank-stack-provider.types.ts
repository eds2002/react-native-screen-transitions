import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackRoute,
	BaseStackScene,
	BaseStackState,
	StackDescriptorSource,
} from "../stack.types";

/**
 * Props for blank stack - generic over descriptor and navigation types.
 * Defaults to the shared base types.
 */
export interface BlankStackProviderProps<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
	TNavigation extends BaseStackNavigation = BaseStackNavigation,
> {
	state: BaseStackState<TDescriptor["route"]>;
	navigation: TNavigation;
	descriptors: Record<string, StackDescriptorSource<TDescriptor>>;
	describe: (
		route: TDescriptor["route"],
		placeholder: boolean,
	) => StackDescriptorSource<TDescriptor>;
}

/**
 * Context value for blank stack — only fields unique to blank stack lifecycle.
 * Shared fields (routes, scenes, etc.) live in StackContext.
 */
export interface BlankStackStoreValue<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
> {
	navigatorKey: string;
	routeKeys: string[];
	routes: TDescriptor["route"][];
	scenes: BaseStackScene<TDescriptor>[];
	scenesByKey: Record<string, BaseStackScene<TDescriptor>>;
	focusedIndex: number;
	requestDismiss: (payload: { route: BaseStackRoute }) => boolean;
	shouldShowFloatOverlay: boolean;
	handleCloseRoute: (payload: { route: BaseStackRoute }) => void;
}
