import { memo, type ReactNode, useMemo } from "react";
import { useNavigationHelpers } from "../hooks/navigation/use-navigation-helpers";
import { BuilderProvider } from "../providers/screen/builder";
import { MotionProvider } from "../providers/screen/motion";
import { OrchestratorProvider } from "../providers/screen/orchestrator";
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
import { ScreenContainer } from "./screen-container";
import { ScreenLifecycle } from "./screen-lifecycle";

interface RouteKeyProps {
	routeKey: string;
}
// Navigation lifecycle and dismissal belong to Blank Stack, inside Builder's
// context so they operate on the same screen values as the motion primitives.
const BlankSceneMotion = ({ children }: { children: ReactNode }) => {
	const { requestDismiss } = useNavigationHelpers();
	return (
		<ScreenLifecycle>
			<MotionProvider onDismissRequest={requestDismiss}>
				<OrchestratorProvider>
					<ScreenContainer onDismissRequest={requestDismiss}>
						{children}
					</ScreenContainer>
				</OrchestratorProvider>
			</MotionProvider>
		</ScreenLifecycle>
	);
};

export const BlankStackScreen = memo(function BlankStackScreen({
	routeKey,
	children,
}: {
	routeKey: string;
	children: ReactNode;
}) {
	const scene = useBlankStackStore((store) => store.scenesByKey[routeKey]);
	const descriptors = useMemo(
		() => ({
			current: scene.descriptor,
			previous: scene.previousDescriptor,
			next: scene.nextDescriptor,
		}),
		[scene.descriptor, scene.previousDescriptor, scene.nextDescriptor],
	);
	return (
		<BuilderProvider routeKey={routeKey} descriptors={descriptors}>
			<BlankSceneMotion>{children}</BlankSceneMotion>
		</BuilderProvider>
	);
});

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
			<BlankStackScreen routeKey={routeKey}>
				<BlankSceneContent routeKey={routeKey} />
			</BlankStackScreen>
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
			config={{ TRANSITIONS_ALWAYS_ON: TRANSITIONS_ALWAYS_ON ?? true }}
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
