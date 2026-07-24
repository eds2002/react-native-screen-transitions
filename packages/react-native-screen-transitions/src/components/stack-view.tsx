import {
	NavigationContext,
	type NavigationProp,
	NavigationRouteContext,
	type ParamListBase,
} from "@react-navigation/native";
import { memo, type ReactNode } from "react";
import { ScreenComposer } from "../providers/screen/screen-composer";
import {
	BlankStackProvider,
	useBlankStackStore,
} from "../providers/stack/blank-stack.provider";
import {
	type StackCoreConfig,
	StackCoreProvider,
} from "../providers/stack/core.provider";
import type {
	BlankStackDescriptor,
	BlankStackNavigationHelpers,
} from "../types/blank-stack.types";
import type { BlankStackProviderProps } from "../types/providers/blank-stack-provider.types";
import { ActivityContainer, ActivityScreen } from "./activity";
import { PortalProvider } from "./boundary/portal";
import { Overlay } from "./overlay";

interface RouteKeyProps {
	routeKey: string;
}

const BlankNavigationProvider = memo(function BlankNavigationProvider({
	children,
	routeKey,
}: RouteKeyProps & { children: ReactNode }) {
	const navigation = useBlankStackStore(
		(store) => store?.scenesByKey[routeKey]?.descriptor.navigation,
	) as NavigationProp<ParamListBase> | undefined;
	const route = useBlankStackStore(
		(store) => store?.scenesByKey[routeKey]?.route,
	);

	if (!navigation || !route) {
		throw new Error(`Blank stack scene "${routeKey}" was not found.`);
	}

	return (
		<NavigationContext.Provider value={navigation}>
			<NavigationRouteContext.Provider value={route}>
				{children}
			</NavigationRouteContext.Provider>
		</NavigationContext.Provider>
	);
});

const BlankSceneContent = memo(function BlankSceneContent({
	routeKey,
}: RouteKeyProps) {
	const render = useBlankStackStore(
		(store) => store?.scenesByKey[routeKey]?.descriptor.render,
	);

	return render?.() ?? null;
});

const BlankSceneRow = memo(function BlankSceneRow({ routeKey }: RouteKeyProps) {
	return (
		<BlankNavigationProvider routeKey={routeKey}>
			<ActivityScreen routeKey={routeKey}>
				<ScreenComposer routeKey={routeKey}>
					<BlankSceneContent routeKey={routeKey} />
				</ScreenComposer>
			</ActivityScreen>
		</BlankNavigationProvider>
	);
});

const EMPTY_ROUTE_KEYS: string[] = [];

const StackViewContent = memo(function StackViewContent() {
	const routeKeys = useBlankStackStore(
		(store) => store?.routeKeys ?? EMPTY_ROUTE_KEYS,
	);
	const shouldShowFloatOverlay = useBlankStackStore(
		(store) => store?.shouldShowFloatOverlay ?? false,
	);

	return (
		<PortalProvider>
			{shouldShowFloatOverlay ? <Overlay.Float /> : null}

			<ActivityContainer>
				{routeKeys.map((routeKey) => (
					<BlankSceneRow key={routeKey} routeKey={routeKey} />
				))}
			</ActivityContainer>
		</PortalProvider>
	);
});

type StackViewProps = BlankStackProviderProps<
	BlankStackDescriptor,
	BlankStackNavigationHelpers
> &
	StackCoreConfig;

export const StackView = memo(function StackView({
	DISABLE_NATIVE_SCREENS,
	DISABLE_NATIVE_SCREEN_CONTAINER,
	TRANSITIONS_ALWAYS_ON,
	STACK_TYPE,
	state,
	navigation,
	descriptors,
	describe,
}: StackViewProps) {
	return (
		<StackCoreProvider
			config={{
				TRANSITIONS_ALWAYS_ON: TRANSITIONS_ALWAYS_ON ?? true,
				STACK_TYPE,
				DISABLE_NATIVE_SCREENS: DISABLE_NATIVE_SCREENS ?? false,
				DISABLE_NATIVE_SCREEN_CONTAINER,
			}}
		>
			<BlankStackProvider
				state={state}
				navigation={navigation}
				descriptors={descriptors}
				describe={describe}
			>
				<StackViewContent />
			</BlankStackProvider>
		</StackCoreProvider>
	);
});
