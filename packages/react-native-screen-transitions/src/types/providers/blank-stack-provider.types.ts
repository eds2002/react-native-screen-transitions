import type {
	BlankStackDescriptor,
	BlankStackNavigationHelpers,
} from "../blank-stack.types";
import type {
	BaseStackRoute,
	BaseStackScene,
	BaseStackState,
} from "../stack.types";

export interface BlankStackProviderProps {
	state: BaseStackState<BlankStackDescriptor["route"]>;
	navigation: BlankStackNavigationHelpers;
	descriptors: Record<string, BlankStackDescriptor>;
	describe: (
		route: BlankStackDescriptor["route"],
		placeholder: boolean,
	) => BlankStackDescriptor;
}

/**
 * Context value for blank stack — only fields unique to blank stack lifecycle.
 * Shared fields (routes, scenes, etc.) live in StackContext.
 */
export interface BlankStackStoreValue {
	navigatorKey: string;
	routeKeys: string[];
	routes: BlankStackDescriptor["route"][];
	scenes: BaseStackScene<BlankStackDescriptor>[];
	scenesByKey: Record<string, BaseStackScene<BlankStackDescriptor>>;
	paintDriverRouteKeyByRouteKey: ReadonlyMap<string, string>;
	focusedIndex: number;
	requestDismiss: (payload: { route: BaseStackRoute }) => boolean;
	shouldShowFloatOverlay: boolean;
	handleCloseRoute: (payload: { route: BaseStackRoute }) => void;
}
