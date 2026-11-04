import type { NavigationState, Route } from "@react-navigation/native";
import { memo, type ReactNode, useMemo } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Overlay } from "../../components/overlay";
import { ScreenLayers } from "../../components/screen-layers";
import { useNavigationHelpers } from "../../navigators/blank-stack/hooks/use-navigation-helpers";
import { BlankStackStoreProvider } from "../../navigators/blank-stack/state/blank-stack.provider";
import { BuilderProvider } from "../../providers/builder";
import { MotionProvider } from "../../providers/motion";
import { OrchestratorProvider } from "../../providers/orchestrator";
import type { BaseStackDescriptor, BaseStackRoute } from "../../types";
import {
	ScreenTransitionsAdapterProvider,
	type ScreenTransitionsAdapterScene,
	useScreenTransitionsAdapterContext,
} from "./context";
import { NativeStackLifecycle } from "./lifecycle";
import {
	type AdapterDescriptorOptions,
	resolveAdapterTransitionOptions,
} from "./options";
import type {
	NavigatorLayout,
	NavigatorLayoutArgs,
	ScreenLayout,
	ScreenLayoutArgs,
} from "./types";

type DescriptorMap = Record<string, BaseStackDescriptor>;

type NavigationStateWithPreloads = NavigationState & {
	preloadedRoutes?: Route<string>[];
};

type TransitionStackState = {
	routes: BaseStackRoute[];
	routeKeys: string[];
	scenes: ScreenTransitionsAdapterScene[];
	routeIndexByKey: Map<string, number>;
	shouldShowFloatOverlay: boolean;
};

const EMPTY_PRELOADED_ROUTES: Route<string>[] = [];

function getPreloadedRoutes(state: NavigationState): Route<string>[] {
	return (
		(state as NavigationStateWithPreloads).preloadedRoutes ??
		EMPTY_PRELOADED_ROUTES
	);
}

function normalizeDescriptor(
	descriptor: BaseStackDescriptor,
): BaseStackDescriptor {
	return {
		...descriptor,
		options: resolveAdapterTransitionOptions(
			descriptor.options as AdapterDescriptorOptions,
		),
	};
}

function buildTransitionStackState({
	state,
	descriptors,
}: {
	state: NavigationState;
	descriptors: DescriptorMap;
}): TransitionStackState {
	const routes = state.routes as BaseStackRoute[];
	const preloadedRoutes = getPreloadedRoutes(state) as BaseStackRoute[];
	const allRoutes = routes.concat(preloadedRoutes);
	const routeKeys = routes.map((route) => route.key);
	const scenes: ScreenTransitionsAdapterScene[] = [];
	const routeIndexByKey = new Map<string, number>();
	let shouldShowFloatOverlay = false;

	for (const route of allRoutes) {
		const descriptor = descriptors[route.key];
		if (!descriptor) {
			if (preloadedRoutes.includes(route)) {
				continue;
			}

			throw new Error(
				`withScreenTransitions could not find a descriptor for route "${route.key}".`,
			);
		}

		const normalizedDescriptor = normalizeDescriptor(descriptor);
		const sceneIndex = scenes.length;
		const previousDescriptor = scenes[sceneIndex - 1]?.descriptor;

		if (previousDescriptor) {
			scenes[sceneIndex - 1] = {
				...scenes[sceneIndex - 1],
				nextDescriptor: normalizedDescriptor,
			};
		}

		scenes.push({
			activity:
				sceneIndex === state.index
					? "active"
					: sceneIndex === state.index - 1
						? "inert"
						: "inactive",
			route,
			descriptor: normalizedDescriptor,
			previousDescriptor,
		});
		routeIndexByKey.set(route.key, sceneIndex);

		if (
			!shouldShowFloatOverlay &&
			normalizedDescriptor.options.overlay &&
			normalizedDescriptor.options.overlayShown !== false
		) {
			shouldShowFloatOverlay = true;
		}
	}

	return {
		routes: allRoutes,
		routeKeys,
		scenes,
		routeIndexByKey,
		shouldShowFloatOverlay,
	};
}

type ScreenTransitionsStackContentProps = {
	layout?: NavigatorLayout;
	layoutArgs: NavigatorLayoutArgs;
};

function ScreenTransitionsStackContent({
	layout,
	layoutArgs,
}: ScreenTransitionsStackContentProps) {
	const transitionState = useMemo(
		() =>
			buildTransitionStackState({
				state: layoutArgs.state,
				descriptors: layoutArgs.descriptors as DescriptorMap,
			}),
		[layoutArgs.state, layoutArgs.descriptors],
	);
	const adapterContextValue = useMemo(
		() => ({
			routeIndexByKey: transitionState.routeIndexByKey,
			scenes: transitionState.scenes,
		}),
		[transitionState.routeIndexByKey, transitionState.scenes],
	);
	const blankStackValue = useMemo(() => {
		const scenesByKey = Object.fromEntries(
			transitionState.scenes.map((scene) => [scene.route.key, scene]),
		);

		return {
			navigatorKey: layoutArgs.state.key,
			routeKeys: transitionState.routeKeys,
			routes: transitionState.routes,
			scenes: transitionState.scenes,
			scenesByKey,
			paintDriverRouteKeyByRouteKey: new Map<string, string>(),
			focusedIndex: layoutArgs.state.index,
			shouldShowFloatOverlay: transitionState.shouldShowFloatOverlay,
		};
	}, [layoutArgs.state.key, layoutArgs.state.index, transitionState]);
	const children = layout ? layout(layoutArgs) : layoutArgs.children;

	return (
		<ScreenTransitionsAdapterProvider value={adapterContextValue}>
			<BlankStackStoreProvider value={blankStackValue}>
				<Overlay />
				{children}
			</BlankStackStoreProvider>
		</ScreenTransitionsAdapterProvider>
	);
}

export function ScreenTransitionsStackLayout(
	props: ScreenTransitionsStackContentProps,
) {
	return (
		<GestureHandlerRootView style={styles.container}>
			<ScreenTransitionsStackContent {...props} />
		</GestureHandlerRootView>
	);
}

const NativeSceneMotion = memo(function NativeSceneMotion({
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
			<NativeStackLifecycle />
		</MotionProvider>
	);
});

export function ScreenTransitionsScreenLayout({
	screenLayout,
	screenLayoutArgs,
}: {
	screenLayout?: ScreenLayout;
	screenLayoutArgs: ScreenLayoutArgs;
}) {
	const { routeIndexByKey, scenes } = useScreenTransitionsAdapterContext();
	const sceneIndex = routeIndexByKey.get(screenLayoutArgs.route.key);
	const children = screenLayout
		? screenLayout(screenLayoutArgs)
		: screenLayoutArgs.children;

	const scene = sceneIndex === undefined ? undefined : scenes[sceneIndex];
	const descriptors = useMemo(
		() =>
			scene
				? {
						current: scene.descriptor,
						previous: scene.previousDescriptor,
						next: scene.nextDescriptor,
					}
				: undefined,
		[scene],
	);

	if (!scene || !descriptors) {
		return <>{children}</>;
	}

	return (
		<BuilderProvider routeKey={scene.route.key} descriptors={descriptors}>
			<NativeSceneMotion>{children}</NativeSceneMotion>
		</BuilderProvider>
	);
}

const styles = StyleSheet.create({ container: { flex: 1 } });
