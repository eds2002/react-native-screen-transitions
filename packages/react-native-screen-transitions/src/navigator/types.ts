import type {
	DefaultRouterOptions,
	Descriptor,
	NavigationProp,
	ParamListBase,
	RouteProp,
	StackActionHelpers,
	StackNavigationState,
} from "@react-navigation/native";
import type {
	NativeStackNavigationEventMap,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	NativeStackNavigatorProps,
} from "@react-navigation/native-stack";
import type { StyleProp, ViewStyle } from "react-native";
import type { TransitionConfig } from "@/types";

/**
 * Remove all props that may match native options + add our own
 */
export interface AwareNativeStackNavigationOptions
	extends Omit<NativeStackNavigationOptions, keyof TransitionConfig>,
		TransitionConfig {
	skipDefaultScreenOptions?: boolean;
}

export type AwareRouterOptions = DefaultRouterOptions;
export type AwareNativeStackActionHelpers = StackActionHelpers<ParamListBase>;
export type AwareNativeStackNavigationEventMap = NativeStackNavigationEventMap;

export type AwareNativeStackNavigatorProps = NativeStackNavigatorProps;

export type AwareNativeStackNavigationState =
	StackNavigationState<ParamListBase>;

export type AwareStackDescriptorMap = {
	[key: string]: AwareStackDescriptor;
};

export type AwareStackDescriptor = Descriptor<
	AwareNativeStackNavigationOptions,
	AwareNavigationProp<ParamListBase>,
	RouteProp<ParamListBase>
>;

export type AwareNavigationProp<
	ParamList extends ParamListBase,
	RouteName extends keyof ParamList = string,
	NavigatorID extends string | undefined = undefined,
> = NavigationProp<
	ParamList,
	RouteName,
	NavigatorID,
	StackNavigationState<ParamList>,
	AwareNativeStackNavigationOptions,
	AwareNativeStackNavigationEventMap
> &
	AwareNativeStackActionHelpers;

export type AwareNavigationProps<
	ParamList extends ParamListBase,
	RouteName extends keyof ParamList = string,
	NavigatorID extends string | undefined = undefined,
> = NativeStackNavigationProp<ParamList, RouteName, NavigatorID>;

/**
 * @link {@link AwareNativeStackView}
 */
export type AwareNativeStackViewProps = {
	state: AwareNativeStackNavigationState;
	navigation: AwareNavigationProps<ParamListBase>;
	descriptors: AwareStackDescriptorMap;
	describe: (
		route: RouteProp<ParamListBase>,
		placeholder: boolean,
	) => AwareStackDescriptor;
};

export type AwareScreenProps = {
	state: AwareNativeStackNavigationState;
	descriptors: AwareStackDescriptorMap;
	preloadedDescriptors: AwareStackDescriptorMap;
	index: number;
	route: RouteProp<ParamListBase>;
};

export interface AwareRootViewProps {
	children: React.ReactNode;
	currentScreenKey: string;
	previousScreenKey?: string;
	nextScreenKey?: string;
	style?: StyleProp<ViewStyle>;
	navigation: AwareNavigationProp<ParamListBase, string, undefined>;
}

export interface AwareContentProps {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	navigation: AwareNavigationProp<ParamListBase, string, undefined>;
}
