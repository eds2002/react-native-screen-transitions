import type { BlankStackProviderProps } from "../../../../types/providers/blank-stack-provider.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackRoute,
	BaseStackScene,
	StackDescriptorSource,
} from "../../../../types/stack.types";

export type BlankStackRoutes<TDescriptor extends BaseStackDescriptor> =
	TDescriptor["route"][];

export type BlankStackDescriptors<TDescriptor extends BaseStackDescriptor> =
	Record<string, TDescriptor>;

export type BlankStackDescriptorSources<
	TDescriptor extends BaseStackDescriptor,
> = Record<string, StackDescriptorSource<TDescriptor>>;

export type LocalRoutesState<TDescriptor extends BaseStackDescriptor> = {
	routes: BlankStackRoutes<TDescriptor>;
	descriptors: BlankStackDescriptors<TDescriptor>;
	sourceDescriptors: BlankStackDescriptorSources<TDescriptor>;
	focusedRouteKey?: string;
	routeChildStates: Record<string, unknown>;
	scenes: BaseStackScene<TDescriptor>[];
	routeKeys: string[];
	shouldShowFloatOverlay: boolean;
	closingRouteKeys: ReadonlySet<string>;
};

export type BlankStackControllerSnapshot<
	TDescriptor extends BaseStackDescriptor,
> = {
	state: LocalRoutesState<TDescriptor>;
};

export type BlankStackController<
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
> = {
	subscribe: (listener: () => void) => () => void;
	getSnapshot: () => BlankStackControllerSnapshot<TDescriptor>;
	update: (props: BlankStackProviderProps<TDescriptor, TNavigation>) => void;
	handleCloseRoute: (payload: { route: BaseStackRoute }) => void;
	requestDismiss: (payload: { route: BaseStackRoute }) => boolean;
};

export type ReconciledRoutes<TDescriptor extends BaseStackDescriptor> = {
	routes: BlankStackRoutes<TDescriptor>;
	descriptors: BlankStackDescriptorSources<TDescriptor>;
};

export type SceneActivityWindow = {
	activeIndex: number;
	inertIndex: number;
};
