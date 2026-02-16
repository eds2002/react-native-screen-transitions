import type { SharedValue } from "react-native-reanimated";
import type { StackContextValue } from "../../hooks/navigation/use-stack";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackRoute,
	BaseStackScene,
	BaseStackState,
} from "../stack.types";

/**
 * Props for managed stack - generic over descriptor and navigation types.
 * Defaults to base types for backward compatibility.
 */
export interface ManagedStackProps<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
	TNavigation extends BaseStackNavigation = BaseStackNavigation,
> {
	state: BaseStackState<TDescriptor["route"]>;
	navigation: TNavigation;
	descriptors: Record<string, TDescriptor>;
	describe: (route: TDescriptor["route"], placeholder: boolean) => TDescriptor;
}

/**
 * Context value for managed stack — only fields unique to managed lifecycle.
 * Shared fields (routes, scenes, etc.) live in StackContext.
 */
export interface ManagedStackContextValue {
	activeScreensLimit: number;
	closingRouteKeysShared: SharedValue<string[]>;
	handleCloseRoute: (payload: { route: BaseStackRoute }) => void;
	backdropBehaviors: string[];
}

/**
 * Props passed to the render child of `withManagedStack`.
 * Only the fields that stack-view components actually consume.
 */
export interface ManagedStackRenderProps<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
> {
	descriptors: Record<string, TDescriptor>;
	scenes: BaseStackScene<TDescriptor>[];
	focusedIndex: number;
	closingRouteMap: React.RefObject<Readonly<Record<string, true>>>;
	shouldShowFloatOverlay: boolean;
}

/**
 * Internal result shape returned by useManagedStackValue.
 */
export interface ManagedStackResult<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
> {
	stackContextValue: StackContextValue;
	managedContextValue: ManagedStackContextValue;
	renderProps: ManagedStackRenderProps<TDescriptor>;
}
