import type {
	EventArg,
	EventMapBase,
	NavigationProp,
	NavigationState,
	ParamListBase,
	RouteProp,
	ScreenListeners,
} from "@react-navigation/native";
import type { TransitionConfig } from "./core";
import type { Any } from "./utils";

export interface CreateTransitionProps extends TransitionConfig {
	navigation: Any;
	route: RouteProp<ParamListBase, string>;
}

export type TransitionListeners = ScreenListeners<
	NavigationState,
	EventMapBase
>;

export type BeforeRemoveEvent = EventArg<
	"beforeRemove",
	true,
	{
		action: {
			type: string;
			payload?: object;
			source?: string;
			target?: string;
		};
	}
>;

export type FocusEvent = EventArg<"focus", false, undefined>;

export type UseNavigation = Omit<
	NavigationProp<ReactNavigation.RootParamList>,
	"getState"
> & {
	getState(): NavigationState | undefined;
};
