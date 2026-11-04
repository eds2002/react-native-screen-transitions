import type { BlankStackDescriptor } from "../../../../types/blank-stack.types";
import type {
	BlankStackDescriptorSources,
	BlankStackProviderProps,
} from "../../../../types/providers/blank-stack-provider.types";
import type {
	BaseStackNavigation,
	BaseStackRoute,
	BaseStackScene,
} from "../../../../types/stack.types";

export type BlankStackRoutes = BaseStackRoute[];

export type BlankStackDescriptors = Record<string, BlankStackDescriptor>;

export type LocalRoutesState = {
	routes: BlankStackRoutes;
	descriptors: BlankStackDescriptors;
	sourceDescriptors: BlankStackDescriptorSources;
	navigation: BaseStackNavigation;
	focusedRouteKey?: string;
	routeChildStates: Record<string, unknown>;
	scenes: BaseStackScene<BlankStackDescriptor>[];
	routeKeys: string[];
	shouldShowFloatOverlay: boolean;
	closingRouteKeys: ReadonlySet<string>;
};

export type BlankStackControllerSnapshot = {
	state: LocalRoutesState;
};

export type BlankStackController = {
	subscribe: (listener: () => void) => () => void;
	getSnapshot: () => BlankStackControllerSnapshot;
	update: (props: BlankStackProviderProps) => void;
	handleOpenRoute: (payload: { route: BaseStackRoute }) => void;
	handleCloseRoute: (payload: { route: BaseStackRoute }) => void;
	requestDismiss: (payload: { route: BaseStackRoute }) => boolean;
};

export type ReconciledRoutes = {
	routes: BlankStackRoutes;
	descriptors: BlankStackDescriptorSources;
};

export type SceneActivityWindow = {
	activeIndex: number;
	inertIndex: number;
};
