import {
	createNavigatorFactory,
	NavigationContainer,
	NavigationIndependentTree,
	type NavigatorTypeBagBase,
	type ParamListBase,
	type StackActionHelpers,
	type StackNavigationState,
	StackRouter,
	type StackRouterOptions,
	type StaticConfig,
	type TypedNavigator,
	useNavigationBuilder,
} from "@react-navigation/native";
import * as React from "react";
import { useTabPressReset } from "../../shared/hooks/navigation/use-tab-press-reset";
import { StackView } from "../components/stack-view";
import type {
	BlankStackFactoryOptions,
	BlankStackNavigationEventMap,
	BlankStackNavigationOptions,
	BlankStackNavigationProp,
	BlankStackNavigatorProps,
} from "../types";

type BlankStackNavigatorInnerProps = BlankStackNavigatorProps & {
	DISABLE_NATIVE_SCREENS?: boolean;
	DISABLE_NATIVE_SCREEN_CONTAINER?: boolean;
};

const BlankStackContext = React.createContext<boolean>(false);
BlankStackContext.displayName = "BlankStackContext";

function BlankStackNavigatorInner({
	id,
	initialRouteName,
	children,
	layout,
	screenListeners,
	screenOptions,
	screenLayout,
	DISABLE_NATIVE_SCREENS,
	DISABLE_NATIVE_SCREEN_CONTAINER,
	...rest
}: BlankStackNavigatorInnerProps) {
	const { state, describe, descriptors, navigation, NavigationContent } =
		useNavigationBuilder<
			StackNavigationState<ParamListBase>,
			StackRouterOptions,
			StackActionHelpers<ParamListBase>,
			BlankStackNavigationOptions,
			BlankStackNavigationEventMap
		>(StackRouter, {
			id,
			initialRouteName,
			children,
			layout,
			screenListeners,
			screenOptions,
			screenLayout,
		});

	useTabPressReset(navigation, state.index, state.key);

	return (
		<NavigationContent>
			<StackView
				{...rest}
				DISABLE_NATIVE_SCREENS={DISABLE_NATIVE_SCREENS}
				DISABLE_NATIVE_SCREEN_CONTAINER={DISABLE_NATIVE_SCREEN_CONTAINER}
				state={state}
				navigation={navigation}
				descriptors={descriptors}
				describe={describe}
			/>
		</NavigationContent>
	);
}

function createBlankStackNavigatorComponent({
	independent,
	enableNativeScreens,
}: Required<BlankStackFactoryOptions>) {
	function BlankStackNavigator(props: BlankStackNavigatorProps) {
		const isNested = React.useContext(BlankStackContext);

		const navigator = (
			<BlankStackNavigatorInner
				{...props}
				{...(!enableNativeScreens && {
					DISABLE_NATIVE_SCREENS: true,
				})}
				DISABLE_NATIVE_SCREEN_CONTAINER={independent}
			/>
		);

		if (!independent || isNested) {
			return navigator;
		}

		return (
			<NavigationIndependentTree>
				<NavigationContainer>
					<BlankStackContext.Provider value={true}>
						{navigator}
					</BlankStackContext.Provider>
				</NavigationContainer>
			</NavigationIndependentTree>
		);
	}

	BlankStackNavigator.displayName = independent
		? "IndependentBlankStackNavigator"
		: "BlankStackNavigator";

	return BlankStackNavigator;
}

const BlankStackNavigator = createBlankStackNavigatorComponent({
	independent: false,
	enableNativeScreens: true,
});

type BlankStackTypeBag<
	ParamList extends ParamListBase,
	NavigatorID extends string | undefined,
> = {
	ParamList: ParamList;
	NavigatorID: NavigatorID;
	State: StackNavigationState<ParamList>;
	ScreenOptions: BlankStackNavigationOptions;
	EventMap: BlankStackNavigationEventMap;
	NavigationList: {
		[RouteName in keyof ParamList]: BlankStackNavigationProp<
			ParamList,
			RouteName,
			NavigatorID
		>;
	};
	Navigator: typeof BlankStackNavigator;
};

/**
 * Creates a blank stack navigator with gesture-driven transitions.
 *
 * By default, blank stack behaves like the existing top-level blank stack:
 * it participates in the current navigation tree and uses native screen
 * primitives on supported native platforms.
 *
 * Pass {@link BlankStackFactoryOptions} when you need embedded-flow behavior:
 * - `independent: true` creates an isolated navigator for nested flows
 * - `enableNativeScreens: false` renders the stack with regular views instead
 *   of `react-native-screens`
 *
 * These options are factory-only. Use screen options for per-screen transition
 * behavior, and use factory options when you need to change how the navigator
 * itself is hosted.
 */
export function createBlankStackNavigator<
	const ParamList extends ParamListBase,
	const NavigatorID extends string | undefined = undefined,
	const TypeBag extends NavigatorTypeBagBase = BlankStackTypeBag<
		ParamList,
		NavigatorID
	>,
>(): TypedNavigator<TypeBag, StaticConfig<TypeBag>>;
export function createBlankStackNavigator<
	const ParamList extends ParamListBase,
	const NavigatorID extends string | undefined = undefined,
	const TypeBag extends NavigatorTypeBagBase = BlankStackTypeBag<
		ParamList,
		NavigatorID
	>,
>(
	/**
	 * Factory-level hosting options for the blank stack.
	 */
	options: BlankStackFactoryOptions,
): TypedNavigator<TypeBag, StaticConfig<TypeBag>>;
export function createBlankStackNavigator<
	const ParamList extends ParamListBase,
	const NavigatorID extends string | undefined = undefined,
	const TypeBag extends NavigatorTypeBagBase = BlankStackTypeBag<
		ParamList,
		NavigatorID
	>,
	const Config extends StaticConfig<TypeBag> &
		BlankStackFactoryOptions = StaticConfig<TypeBag> & BlankStackFactoryOptions,
>(config?: Config): TypedNavigator<TypeBag, Config> {
	const {
		independent = false,
		enableNativeScreens = true,
		...staticConfig
	} = (config ?? {}) as StaticConfig<TypeBag> & BlankStackFactoryOptions;

	const Navigator = createBlankStackNavigatorComponent({
		independent,
		enableNativeScreens,
	});

	return createNavigatorFactory(Navigator)(
		(config ? (staticConfig as StaticConfig<TypeBag>) : undefined) as Config,
	);
}
