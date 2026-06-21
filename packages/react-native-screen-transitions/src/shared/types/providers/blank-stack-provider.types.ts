import type { StackContextValue } from "../../hooks/navigation/use-stack";
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
 * Defaults to base types for backward compatibility.
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
export interface BlankStackProviderContextValue {
	handleCloseRoute: (payload: { route: BaseStackRoute }) => void;
}

/**
 * Props passed to the render child of `withBlankStack`.
 * Only the fields that stack-view components actually consume.
 */
export interface BlankStackProviderRenderProps<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
> {
	scenes: BaseStackScene<TDescriptor>[];
	focusedIndex: number;
	shouldShowFloatOverlay: boolean;
}

/**
 * Internal result shape returned by useBlankStackProviderValue.
 */
export interface BlankStackProviderResult<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
> {
	stackContextValue: StackContextValue;
	blankStackProviderContextValue: BlankStackProviderContextValue;
	renderProps: BlankStackProviderRenderProps<TDescriptor>;
}
