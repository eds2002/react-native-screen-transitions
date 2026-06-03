import type { NavigationState, Route } from "@react-navigation/native";
import { useMemo } from "react";
import { Overlay } from "../../components/overlay";
import {
	type StackContextValue,
	StackProvider,
} from "../../hooks/navigation/use-stack";
import { ScreenComposer } from "../../providers/screen/screen-composer";
import {
	useStackCoreContext,
	withStackCore,
} from "../../providers/stack/core.provider";
import { useStackDerived } from "../../providers/stack/helpers/use-stack-derived";
import {
	AnimationStore,
	type AnimationStoreMap,
} from "../../stores/animation.store";
import type { BaseStackDescriptor, BaseStackRoute } from "../../types";
import { StackType } from "../../types/stack.types";
import { isOverlayVisible } from "../../utils/overlay/visibility";
import {
	ScreenTransitionsAdapterProvider,
	type ScreenTransitionsAdapterScene,
	useScreenTransitionsAdapterContext,
} from "./context";
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
	animationMaps: AnimationStoreMap[];
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
	const routeKeys: string[] = [];
	const scenes: ScreenTransitionsAdapterScene[] = [];
	const animationMaps: AnimationStoreMap[] = [];
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
			route,
			descriptor: normalizedDescriptor,
			previousDescriptor,
		});
		routeKeys.push(route.key);
		animationMaps.push(AnimationStore.getBag(route.key));
		routeIndexByKey.set(route.key, sceneIndex);

		if (
			!shouldShowFloatOverlay &&
			(normalizedDescriptor.options as AdapterDescriptorOptions)
				.enableTransitions &&
			isOverlayVisible(normalizedDescriptor.options)
		) {
			shouldShowFloatOverlay = true;
		}
	}

	return {
		routes: allRoutes,
		routeKeys,
		scenes,
		animationMaps,
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
	const { flags } = useStackCoreContext();
	const transitionState = useMemo(
		() =>
			buildTransitionStackState({
				state: layoutArgs.state,
				descriptors: layoutArgs.descriptors as DescriptorMap,
			}),
		[layoutArgs.state, layoutArgs.descriptors],
	);
	const { optimisticFocusedIndex } = useStackDerived(
		transitionState.animationMaps,
	);
	const stackContextValue = useMemo<StackContextValue>(
		() => ({
			flags,
			navigatorKey: layoutArgs.state.key,
			routeKeys: transitionState.routeKeys,
			routes: transitionState.routes as Route<string>[],
			scenes: transitionState.scenes,
			optimisticFocusedIndex,
			focusedIndex: layoutArgs.state.index,
		}),
		[
			flags,
			layoutArgs.state.key,
			layoutArgs.state.index,
			transitionState.routeKeys,
			transitionState.routes,
			transitionState.scenes,
			optimisticFocusedIndex,
		],
	);
	const adapterContextValue = useMemo(
		() => ({
			routeIndexByKey: transitionState.routeIndexByKey,
			scenes: transitionState.scenes,
		}),
		[transitionState.routeIndexByKey, transitionState.scenes],
	);
	const children = layout ? layout(layoutArgs) : layoutArgs.children;

	return (
		<ScreenTransitionsAdapterProvider value={adapterContextValue}>
			<StackProvider value={stackContextValue}>
				{transitionState.shouldShowFloatOverlay ? <Overlay.Float /> : null}
				{children}
			</StackProvider>
		</ScreenTransitionsAdapterProvider>
	);
}

export const ScreenTransitionsStackLayout = withStackCore(
	{ TRANSITIONS_ALWAYS_ON: false, STACK_TYPE: StackType.NATIVE },
	ScreenTransitionsStackContent,
);

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

	if (sceneIndex === undefined) {
		return <>{children}</>;
	}

	const scene = scenes[sceneIndex];

	return (
		<ScreenComposer
			previous={scene.previousDescriptor}
			current={scene.descriptor}
			next={scene.nextDescriptor}
		>
			{children}
		</ScreenComposer>
	);
}
