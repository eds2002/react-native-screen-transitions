import type { NavigatorDescriptor } from "standard-navigation";
import type { BlankStackNavigationOptions } from "../blank-stack.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackRoute,
	BaseStackScene,
	BaseStackState,
} from "../stack.types";

export interface BlankStackProviderProps {
	state: BaseStackState<BaseStackRoute>;
	navigation: BaseStackNavigation;
	descriptors: BlankStackDescriptorSources;
}

export type BlankStackDescriptorSource =
	NavigatorDescriptor<BlankStackNavigationOptions>;

export type BlankStackDescriptorSources = Record<
	string,
	BlankStackDescriptorSource
>;

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
	handleOpenRoute?: (payload: { route: BaseStackRoute }) => void;
	handleCloseRoute?: (payload: { route: BaseStackRoute }) => void;
}
