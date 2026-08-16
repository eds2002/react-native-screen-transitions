import { memo, type ReactNode } from "react";
import { NavigationScreenProvider } from "../providers/navigation/navigation-host.provider";
import { ScreenComposer } from "../providers/screen/screen-composer";
import {
	BlankStackProvider,
	useBlankStackStore,
} from "../providers/stack/blank-stack.provider";
import {
	type StackCoreConfig,
	StackCoreProvider,
} from "../providers/stack/core.provider";
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
		(store) => store.scenesByKey[routeKey]?.descriptor.navigation,
	);
	const route = useBlankStackStore(
		(store) => store.scenesByKey[routeKey]?.route,
	);

	if (!navigation || !route) {
		throw new Error(`Blank stack scene "${routeKey}" was not found.`);
	}

	return (
		<NavigationScreenProvider navigation={navigation} route={route}>
			{children}
		</NavigationScreenProvider>
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

	return (
		<PortalProvider>
			<Overlay.Float />

			<ActivityContainer>
				{routeKeys.map((routeKey) => (
					<BlankSceneRow key={routeKey} routeKey={routeKey} />
				))}
			</ActivityContainer>
		</PortalProvider>
	);
});

type StackViewProps = BlankStackProviderProps & StackCoreConfig;

export const StackView = memo(function StackView({
	TRANSITIONS_ALWAYS_ON,
	state,
	navigation,
	descriptors,
	describe,
}: StackViewProps) {
	return (
		<StackCoreProvider
			config={{
				TRANSITIONS_ALWAYS_ON: TRANSITIONS_ALWAYS_ON ?? true,
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
