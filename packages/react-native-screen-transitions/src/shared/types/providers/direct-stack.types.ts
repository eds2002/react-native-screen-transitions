import type {
	ParamListBase,
	RouteProp,
	StackNavigationState,
} from "@react-navigation/native";
import type {
	NativeStackDescriptor,
	NativeStackDescriptorMap,
	NativeStackNavigationHelpers,
} from "../../../native-stack/types";

export interface DirectStackScene {
	route: StackNavigationState<ParamListBase>["routes"][number];
	descriptor: NativeStackDescriptor;
	isPreloaded: boolean;
}

export interface DirectStackProps {
	state: StackNavigationState<ParamListBase>;
	navigation: NativeStackNavigationHelpers;
	descriptors: NativeStackDescriptorMap;
	describe: (
		route: RouteProp<ParamListBase>,
		placeholder: boolean,
	) => NativeStackDescriptor;
}

export interface DirectStackContextValue {
	state: StackNavigationState<ParamListBase>;
	navigation: NativeStackNavigationHelpers;
	descriptors: NativeStackDescriptorMap;
	scenes: DirectStackScene[];
	focusedIndex: number;
	shouldShowFloatOverlay: boolean;
}
