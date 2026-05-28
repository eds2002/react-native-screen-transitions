import type { AnimationStoreMap } from "../../../../../stores/animation.store";
import type { ManagedStackProps } from "../../../../../types/providers/managed-stack.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackRoute,
	BaseStackScene,
	StackDescriptorSource,
} from "../../../../../types/stack.types";

export type ManagedRoutes<TDescriptor extends BaseStackDescriptor> =
	TDescriptor["route"][];

export type ManagedDescriptors<TDescriptor extends BaseStackDescriptor> =
	Record<string, TDescriptor>;

export type ManagedDescriptorSources<TDescriptor extends BaseStackDescriptor> =
	Record<string, StackDescriptorSource<TDescriptor>>;

export type LocalRoutesState<TDescriptor extends BaseStackDescriptor> = {
	routes: ManagedRoutes<TDescriptor>;
	descriptors: ManagedDescriptors<TDescriptor>;
	sourceDescriptors: ManagedDescriptorSources<TDescriptor>;
	scenes: BaseStackScene<TDescriptor>[];
	routeKeys: string[];
	animationMaps: AnimationStoreMap[];
	shouldShowFloatOverlay: boolean;
	closingRouteKeys: ReadonlySet<string>;
};

export type ManagedStackControllerSnapshot<
	TDescriptor extends BaseStackDescriptor,
> = {
	state: LocalRoutesState<TDescriptor>;
};

export type ManagedStackController<
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
> = {
	subscribe: (listener: () => void) => () => void;
	getSnapshot: () => ManagedStackControllerSnapshot<TDescriptor>;
	update: (props: ManagedStackProps<TDescriptor, TNavigation>) => void;
	handleCloseRoute: (payload: { route: BaseStackRoute }) => void;
	requestDismiss: (payload: { route: BaseStackRoute }) => boolean;
};

export type ReconciledRoutes<TDescriptor extends BaseStackDescriptor> = {
	routes: ManagedRoutes<TDescriptor>;
	descriptors: ManagedDescriptorSources<TDescriptor>;
};

export type SceneActivityWindow = {
	focusedIndex: number;
	topIndex: number;
	topIsClosing: boolean;
};
