import { memo, type ReactNode, useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
	SafeAreaInsetsContext,
	SafeAreaProvider,
} from "react-native-safe-area-context";
import { PortalProvider } from "../../../components/boundary/portal";
import { Overlay } from "../../../components/overlay";
import { ScreenLayers } from "../../../components/screen-layers";
import { BuilderProvider } from "../../../providers/builder";
import { MotionProvider } from "../../../providers/motion";
import { OrchestratorProvider } from "../../../providers/orchestrator";
import type { BlankStackProviderProps } from "../../../types/providers/blank-stack-provider.types";
import { useNavigationHelpers } from "../hooks/use-navigation-helpers";
import {
	BlankStackProvider,
	useBlankStackStore,
} from "../state/blank-stack.provider";
import { ActivityContainer, ActivityScreen } from "./activity";
import { BlankStackLifecycle } from "./lifecycle/blank-stack";

const SceneMotion = memo(function SceneMotion({
	children,
}: {
	children: ReactNode;
}) {
	const { requestDismiss } = useNavigationHelpers();
	return (
		<MotionProvider onDismissRequest={requestDismiss}>
			<OrchestratorProvider>
				<ScreenLayers onDismissRequest={requestDismiss}>
					{children}
				</ScreenLayers>
			</OrchestratorProvider>
			<BlankStackLifecycle />
		</MotionProvider>
	);
});

interface RouteKeyProps {
	routeKey: string;
}

const BlankSceneRow = memo(function BlankSceneRow({ routeKey }: RouteKeyProps) {
	const scene = useBlankStackStore((store) => store.scenesByKey[routeKey]);
	const descriptors = useMemo(
		() =>
			scene && {
				current: scene.descriptor,
				previous: scene.previousDescriptor,
				next: scene.nextDescriptor,
				closingNext: scene.closingNextDescriptor,
			},
		// Scenes are reused while none of their descriptors change.
		[scene],
	);

	// A row can re-render from a store snapshot that no longer has its route (it was just removed)
	// before the list above it re-renders and drops the row: render nothing until then.
	if (!scene || !descriptors) {
		return null;
	}

	return (
		<ActivityScreen routeKey={routeKey}>
			<BuilderProvider routeKey={routeKey} descriptors={descriptors}>
				<SceneMotion>{scene.descriptor.render?.()}</SceneMotion>
			</BuilderProvider>
		</ActivityScreen>
	);
});

export const BlankStackView = memo(function BlankStackView() {
	const routeKeys = useBlankStackStore((store) => store?.routeKeys);
	return (
		<PortalProvider>
			<Overlay />
			<ActivityContainer>
				{routeKeys.map((routeKey) => (
					<BlankSceneRow key={routeKey} routeKey={routeKey} />
				))}
			</ActivityContainer>
		</PortalProvider>
	);
});

/**
 * Provides safe-area insets only when nothing above does (like React Navigation's
 * SafeAreaProviderCompat). A provider measures insets from where it sits on screen, so a nested
 * stack with its own provider got new insets whenever an outer screen moved it (a drag, a
 * transition), a frame late: its content stayed pinned while the screen moved, then jumped.
 */
function SafeAreaProviderIfNeeded({ children }: { children: ReactNode }) {
	const insets = useContext(SafeAreaInsetsContext);
	if (insets) {
		return <View style={styles.container}>{children}</View>;
	}
	return <SafeAreaProvider>{children}</SafeAreaProvider>;
}

export const BlankStack = memo(function BlankStack({
	state,
	navigation,
	descriptors,
}: BlankStackProviderProps) {
	return (
		<GestureHandlerRootView style={styles.container}>
			<SafeAreaProviderIfNeeded>
				<BlankStackProvider
					state={state}
					navigation={navigation}
					descriptors={descriptors}
				>
					<BlankStackView />
				</BlankStackProvider>
			</SafeAreaProviderIfNeeded>
		</GestureHandlerRootView>
	);
});

const styles = StyleSheet.create({ container: { flex: 1 } });
