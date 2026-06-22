import type {
	Descriptor,
	NavigationHelpers,
	NavigationProp,
	ParamListBase,
	RouteProp,
	StackActionHelpers,
	StackNavigationState,
} from "@react-navigation/native";
import type { ScreenTransitionConfig } from "../screen.types";
import type { DescriptorMap } from "../stack.types";

export type DirectStackNavigationEventMap = {};

export type DirectStackNavigationHelpers = NavigationHelpers<
	ParamListBase,
	DirectStackNavigationEventMap
>;

export type DirectStackNavigationProp<
	ParamList extends ParamListBase,
	RouteName extends keyof ParamList = string,
	NavigatorID extends string | undefined = undefined,
> = NavigationProp<
	ParamList,
	RouteName,
	NavigatorID,
	StackNavigationState<ParamList>,
	DirectStackNavigationOptions,
	DirectStackNavigationEventMap
> &
	StackActionHelpers<ParamList>;

export type DirectStackNavigationOptions = ScreenTransitionConfig & {
	enableTransitions?: boolean;
};

export type DirectStackDescriptor = Descriptor<
	DirectStackNavigationOptions,
	DirectStackNavigationProp<ParamListBase>,
	RouteProp<ParamListBase>
>;

export type DirectStackDescriptorMap = DescriptorMap<DirectStackDescriptor>;

export interface DirectStackScene {
	route: StackNavigationState<ParamListBase>["routes"][number];
	descriptor: DirectStackDescriptor;
	isPreloaded: boolean;
}

export interface DirectStackProps {
	state: StackNavigationState<ParamListBase>;
	navigation: DirectStackNavigationHelpers;
	descriptors: DirectStackDescriptorMap;
	describe: (
		route: RouteProp<ParamListBase>,
		placeholder: boolean,
	) => DirectStackDescriptor;
}

export interface DirectStackContextValue {
	state: StackNavigationState<ParamListBase>;
	navigation: DirectStackNavigationHelpers;
	descriptors: DirectStackDescriptorMap;
	scenes: DirectStackScene[];
	focusedIndex: number;
	shouldShowFloatOverlay: boolean;
}
