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
import {
	PreloadedSceneContext,
	useIsPreloadedScene,
} from "../../../providers/preloaded-scene-context";
import type {
	BlankStackDescriptorSource,
	BlankStackProviderProps,
} from "../../../types/providers/blank-stack-provider.types";
import type { BaseStackDescriptor } from "../../../types/stack.types";
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
	const preloaded = useIsPreloadedScene();
	const onDismissRequest = preloaded ? undefined : requestDismiss;
	return (
		<MotionProvider onDismissRequest={onDismissRequest}>
			<OrchestratorProvider>
				<ScreenLayers onDismissRequest={onDismissRequest}>
					{children}
				</ScreenLayers>
			</OrchestratorProvider>
			{!preloaded && <BlankStackLifecycle />}
		</MotionProvider>
	);
});

type PreloadedScene = {
	descriptor: BaseStackDescriptor;
	render: BlankStackDescriptorSource["render"];
};

interface RouteKeyProps {
	routeKey: string;
	preloadedScene?: PreloadedScene;
}

const BlankSceneRow = memo(function BlankSceneRow({
	routeKey,
	preloadedScene,
}: RouteKeyProps) {
	const scene = useBlankStackStore((store) => store.scenesByKey[routeKey]);
	const isPreloaded = useIsPreloadedScene() || !scene;
	const descriptors = useMemo(
		() =>
			scene
				? {
						current: scene.descriptor,
						previous: scene.previousDescriptor,
						next: scene.nextDescriptor,
						closingNext: scene.closingNextDescriptor,
					}
				: preloadedScene && { current: preloadedScene.descriptor },
		// Scenes are reused while none of their descriptors change.
		[scene, preloadedScene],
	);

	// A row can re-render from a store snapshot that no longer has its route (it was just removed)
	// before the list above it re-renders and drops the row: render nothing until then.
	if (!descriptors) {
		return null;
	}

	return (
		<ActivityScreen routeKey={routeKey} preloaded={!scene}>
			<PreloadedSceneContext.Provider value={isPreloaded}>
				<BuilderProvider routeKey={routeKey} descriptors={descriptors}>
					<SceneMotion>
						{scene ? scene.descriptor.render?.() : preloadedScene?.render()}
					</SceneMotion>
				</BuilderProvider>
			</PreloadedSceneContext.Provider>
		</ActivityScreen>
	);
});

type BlankStackViewProps = {
	preloadedScenes?: ReadonlyMap<string, PreloadedScene>;
};

const EMPTY_PRELOADED_SCENES = new Map<string, PreloadedScene>();

export const BlankStackView = memo(function BlankStackView({
	preloadedScenes = EMPTY_PRELOADED_SCENES,
}: BlankStackViewProps) {
	const routeKeys = useBlankStackStore((store) => store?.routeKeys);
	const renderedKeys = preloadedScenes.size
		? [
				...routeKeys,
				...Array.from(preloadedScenes.keys()).filter(
					(key) => !routeKeys.includes(key),
				),
			]
		: routeKeys;
	return (
		<PortalProvider>
			<Overlay />
			<ActivityContainer>
				{renderedKeys.map((routeKey) => (
					<BlankSceneRow
						key={routeKey}
						routeKey={routeKey}
						preloadedScene={preloadedScenes.get(routeKey)}
					/>
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
	const preloadedScenes = useMemo(() => {
		const entries = new Map<string, PreloadedScene>();
		for (const route of state.preloadedRoutes ?? []) {
			const source = descriptors[route.key];
			if (!source) continue;
			entries.set(route.key, {
				descriptor: { route, navigation, options: source.options },
				render: source.render,
			});
		}
		return entries;
	}, [descriptors, navigation, state.preloadedRoutes]);
	return (
		<GestureHandlerRootView style={styles.container}>
			<SafeAreaProviderIfNeeded>
				<BlankStackProvider
					state={state}
					navigation={navigation}
					descriptors={descriptors}
				>
					<BlankStackView preloadedScenes={preloadedScenes} />
				</BlankStackProvider>
			</SafeAreaProviderIfNeeded>
		</GestureHandlerRootView>
	);
});

const styles = StyleSheet.create({ container: { flex: 1 } });
