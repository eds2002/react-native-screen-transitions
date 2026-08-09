import { Fragment, memo } from "react";
import { Overlay } from "../../shared/components/overlay";
import { SceneView } from "../../shared/components/scene-view";
import { ScreenComposer } from "../../shared/providers/screen/screen-composer";
import {
	BlankStackProvider,
	useBlankStackStore,
} from "../../shared/providers/stack/blank-stack.provider";
import {
	type StackCoreConfig,
	StackCoreProvider,
} from "../../shared/providers/stack/core.provider";
import type { BlankStackProviderProps } from "../../shared/types/providers/blank-stack-provider.types";
import { StackType } from "../../shared/types/stack.types";
import type {
	ComponentStackDescriptor,
	ComponentStackNavigationHelpers,
} from "../types";
import { ComponentScreen } from "./component-screen";

const EMPTY_ROUTE_KEYS: string[] = [];

const ComponentSceneContent = memo(function ComponentSceneContent({
	routeKey,
}: {
	routeKey: string;
}) {
	const descriptor = useBlankStackStore(
		(store) => store?.scenesByKey[routeKey]?.descriptor,
	) as ComponentStackDescriptor | undefined;

	if (!descriptor) {
		throw new Error(`Component stack scene "${routeKey}" was not found.`);
	}

	return <SceneView descriptor={descriptor} />;
});

const ComponentSceneRow = memo(function ComponentSceneRow({
	routeKey,
}: {
	routeKey: string;
}) {
	return (
		<ComponentScreen routeKey={routeKey}>
			<ScreenComposer routeKey={routeKey}>
				<ComponentSceneContent routeKey={routeKey} />
			</ScreenComposer>
		</ComponentScreen>
	);
});

const StackViewContent = memo(function StackViewContent() {
	const routeKeys = useBlankStackStore(
		(store) => store?.routeKeys ?? EMPTY_ROUTE_KEYS,
	);

	return (
		<Fragment>
			<Overlay.Float />

			{routeKeys.map((routeKey) => (
				<ComponentSceneRow key={routeKey} routeKey={routeKey} />
			))}
		</Fragment>
	);
});

type StackViewProps = BlankStackProviderProps<
	ComponentStackDescriptor,
	ComponentStackNavigationHelpers
> &
	StackCoreConfig;

export const StackView = memo(function StackView({
	DISABLE_NATIVE_SCREENS,
	DISABLE_NATIVE_SCREEN_CONTAINER,
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
				STACK_TYPE: StackType.COMPONENT,
				DISABLE_NATIVE_SCREENS,
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
