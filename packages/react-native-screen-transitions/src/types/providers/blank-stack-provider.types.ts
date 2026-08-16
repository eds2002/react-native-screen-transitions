import type {
	BlankStackDescriptor,
	BlankStackNavigationHelpers,
} from "../blank-stack.types";
import type {
	BaseStackDescriptor,
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

export interface BlankStackStoreValue {
	navigatorKey: string;
	routeKeys: string[];
	routes: BaseStackRoute[];
	scenes: BaseStackScene<BaseStackDescriptor>[];
	scenesByKey: Record<string, BaseStackScene<BaseStackDescriptor>>;
	paintDriverRouteKeyByRouteKey: ReadonlyMap<string, string>;
	focusedIndex: number;
	requestDismiss?: (payload: { route: BaseStackRoute }) => boolean;
	shouldShowFloatOverlay: boolean;
	handleCloseRoute?: (payload: { route: BaseStackRoute }) => void;
}
