import type {
	NavigationProp,
	NavigationState,
	NavigatorTypeBagBase,
	ParamListBase,
	StackActionHelpers,
	StackNavigationState,
	StaticConfig,
	TypedNavigator,
} from "@react-navigation/native";
import type { NativeStackAdapterOptions } from "./options";

type AdapterState<
	Bag extends NavigatorTypeBagBase,
	Params extends ParamListBase,
> =
	Bag["State"] extends StackNavigationState<ParamListBase>
		? StackNavigationState<Params>
		: Omit<Bag["State"], keyof NavigationState> & NavigationState<Params>;

type AdapterNavigation<
	Bag extends NavigatorTypeBagBase,
	Params extends ParamListBase,
	Name extends keyof Params,
	ID extends string | undefined,
> = Omit<
	Bag["NavigationList"][keyof Bag["ParamList"]],
	keyof NavigationProp<ParamListBase> | keyof StackActionHelpers<ParamListBase>
> &
	NavigationProp<
		Params,
		Name,
		ID,
		AdapterState<Bag, Params>,
		NativeStackAdapterOptions<Bag["ScreenOptions"]>,
		Bag["EventMap"]
	> &
	(Bag["State"] extends StackNavigationState<ParamListBase>
		? StackActionHelpers<Params>
		: {});

type AdapterTypeBag<
	Bag extends NavigatorTypeBagBase,
	Params extends ParamListBase,
	ID extends string | undefined,
> = Omit<
	Bag,
	"ParamList" | "NavigatorID" | "State" | "ScreenOptions" | "NavigationList"
> & {
	ParamList: Params;
	NavigatorID: ID;
	State: AdapterState<Bag, Params>;
	ScreenOptions: NativeStackAdapterOptions<Bag["ScreenOptions"]>;
	NavigationList: {
		[Name in keyof Params]: AdapterNavigation<Bag, Params, Name, ID>;
	};
};

/** Retain the host's navigator props and events while adding transition options. */
export type ScreenTransitionsFactory<Bag extends NavigatorTypeBagBase> = <
	const Params extends ParamListBase = Bag["ParamList"],
	const ID extends string | undefined = Bag["NavigatorID"],
	const TypeBag extends NavigatorTypeBagBase = AdapterTypeBag<Bag, Params, ID>,
	const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(
	config?: Config,
) => TypedNavigator<TypeBag, Config>;
