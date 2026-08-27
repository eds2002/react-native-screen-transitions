import { memo } from "react";
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

const BlankSceneContent = memo(function BlankSceneContent({
	routeKey,
}: RouteKeyProps) {
	const render = useBlankStackStore(
		(store) => store?.scenesByKey[routeKey]?.descriptor.render,
	);

	return render?.();
});

const BlankSceneRow = memo(function BlankSceneRow({ routeKey }: RouteKeyProps) {
	return (
		<ActivityScreen routeKey={routeKey}>
			<ScreenComposer routeKey={routeKey}>
				<BlankSceneContent routeKey={routeKey} />
			</ScreenComposer>
		</ActivityScreen>
	);
});

const StackViewContent = memo(function StackViewContent() {
	const routeKeys = useBlankStackStore((store) => store?.routeKeys);

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
			>
				<StackViewContent />
			</BlankStackProvider>
		</StackCoreProvider>
	);
});
