import * as React from "react";
import {
	createStandardNavigator,
	type NavigatorDescriptor,
} from "standard-navigation";
import type {
	BlankStackDescriptor,
	BlankStackFactoryOptions,
	BlankStackNavigationHelpers,
	BlankStackNavigationOptions,
} from "../../blank-stack/types";
import { StackView } from "../components/stack-view";
import {
	type NavigationHostContextValue,
	NavigationHostProvider,
} from "../providers/navigation/navigation-host.provider";
import type {
	BaseStackNavigation,
	BaseStackRoute,
	BaseStackState,
	StackDescriptorSource,
} from "../types/stack.types";

export type BlankStackStandardEventMap = {};

export type BlankStackStandardNavigatorProps = BlankStackFactoryOptions & {
	navigationState?: BaseStackState<BaseStackRoute>;
	navigation?: BaseStackNavigation;
	navigationHost?: NavigationHostContextValue;
};

type StandardDescriptor = NavigatorDescriptor<BlankStackNavigationOptions> & {
	navigation?: BaseStackNavigation;
	route?: BaseStackRoute;
};

type StandardDescriptorMap = Record<string, StandardDescriptor>;
type BlankStackDescriptorSourceMap = Record<
	string,
	StackDescriptorSource<BlankStackDescriptor>
>;

function createDescriptorMap({
	routes,
	descriptors,
	navigation,
}: {
	routes: BaseStackRoute[];
	descriptors: StandardDescriptorMap;
	navigation: BaseStackNavigation;
}): BlankStackDescriptorSourceMap {
	const result: BlankStackDescriptorSourceMap = {};

	for (const route of routes) {
		const descriptor = descriptors[route.key];

		if (!descriptor) {
			continue;
		}

		result[route.key] = {
			route: descriptor.route ?? route,
			navigation: (descriptor.navigation ??
				navigation) as BlankStackDescriptor["navigation"],
			options: descriptor.options,
			render: () => descriptor.render() as React.JSX.Element,
		};
	}

	return result;
}

export const BlankStackNavigator = createStandardNavigator<
	BlankStackNavigationOptions,
	BlankStackStandardEventMap,
	BlankStackStandardNavigatorProps
>(
	({
		actions,
		descriptors,
		state,
		navigation,
		navigationHost,
		navigationState,
		nativeScreens,
		enableNativeScreens,
	}) => {
		const stackState = navigationState ?? {
			key: "blank-stack",
			index: state.index,
			routes: state.routes as BaseStackRoute[],
		};
		const stackStateRef = React.useRef(stackState);
		stackStateRef.current = stackState;

		const fallbackNavigation = React.useMemo<BaseStackNavigation>(
			() => ({
				getState: () => stackStateRef.current,
				dispatch: (action) => {
					if (action?.type === "GO_BACK" || action?.type === "POP") {
						actions.back();
						return;
					}

					const name = action?.payload?.name;
					if (action?.type === "NAVIGATE" && typeof name === "string") {
						actions.navigate(name, action.payload.params);
					}
				},
			}),
			[actions],
		);
		const stackNavigation = navigation ?? fallbackNavigation;
		const nativeScreensEnabled = nativeScreens ?? enableNativeScreens ?? true;
		const stackDescriptors = React.useMemo(
			() =>
				createDescriptorMap({
					routes: stackState.routes,
					descriptors,
					navigation: stackNavigation,
				}),
			[descriptors, stackNavigation, stackState.routes],
		);
		const describe = React.useCallback(
			(route: BlankStackDescriptor["route"]) => {
				const descriptor = stackDescriptors[route.key];

				if (!descriptor) {
					throw new Error(
						`BlankStack could not find a descriptor for route "${route.key}".`,
					);
				}

				return descriptor;
			},
			[stackDescriptors],
		);

		return (
			<NavigationHostProvider value={navigationHost}>
				<StackView
					DISABLE_NATIVE_SCREENS={!nativeScreensEnabled}
					state={stackState}
					navigation={stackNavigation as BlankStackNavigationHelpers}
					descriptors={stackDescriptors}
					describe={describe}
				/>
			</NavigationHostProvider>
		);
	},
);
