import type { ManagedStackProps } from "../../../../../types/providers/managed-stack.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackScene,
	StackDescriptorSource,
	StackSceneActivity,
} from "../../../../../types/stack.types";
import { resolveSceneNeighbors } from "../../../../../utils/navigation/resolve-scene-neighbors";
import { isOverlayVisible } from "../../../../../utils/overlay/visibility";
import {
	areDescriptorSourcesEquivalent,
	areDescriptorsEqual,
	areRouteChildStateMapsEqual,
	getRouteChildState,
	setsAreEqual,
} from "./helpers";
import type {
	LocalRoutesState,
	ManagedDescriptorSources,
	ManagedDescriptors,
	ManagedRoutes,
	SceneActivityWindow,
} from "./types";

type BuildManagedStackStateParams<
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
> = {
	props: ManagedStackProps<TDescriptor, TNavigation>;
	routes: ManagedRoutes<TDescriptor>;
	descriptors: ManagedDescriptorSources<TDescriptor>;
	closingRouteKeys: ReadonlySet<string>;
	previousState?: LocalRoutesState<TDescriptor>;
};

const areRouteKeysEqual = (a: string[], b: string[]): boolean => {
	if (a === b) return true;
	if (a.length !== b.length) return false;

	return a.every((key, index) => key === b[index]);
};

const resolveStableDescriptorSource = <
	TDescriptor extends BaseStackDescriptor,
>({
	routeKey,
	sourceDescriptor,
	previousState,
}: {
	routeKey: string;
	sourceDescriptor: StackDescriptorSource<TDescriptor>;
	previousState?: LocalRoutesState<TDescriptor>;
}): StackDescriptorSource<TDescriptor> => {
	const previousSourceDescriptor = previousState?.sourceDescriptors[routeKey];

	if (
		previousSourceDescriptor &&
		areDescriptorSourcesEquivalent(previousSourceDescriptor, sourceDescriptor)
	) {
		return previousSourceDescriptor;
	}

	return sourceDescriptor;
};

const getSceneActivity = ({
	focusedIndex,
	isClosing,
	sceneIndex,
	topIndex,
	topIsClosing,
}: SceneActivityWindow & {
	isClosing: boolean;
	sceneIndex: number;
}): StackSceneActivity => {
	if (isClosing) {
		return "closing";
	}

	if (topIsClosing) {
		return sceneIndex === focusedIndex ? "inert" : "inactive";
	}

	if (sceneIndex === topIndex) {
		return "active";
	}

	if (sceneIndex === topIndex - 1) {
		return "inert";
	}

	return "inactive";
};

const getSceneActivityWindow = <
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>({
	props,
	routes,
	closingRouteKeys,
}: BuildManagedStackStateParams<
	TDescriptor,
	TNavigation
>): SceneActivityWindow => {
	const focusedRouteKey = props.state.routes[props.state.index]?.key;

	let focusedIndex = Math.max(
		0,
		routes.findIndex((route) => route.key === focusedRouteKey),
	);

	while (focusedIndex > 0 && closingRouteKeys.has(routes[focusedIndex]?.key)) {
		focusedIndex--;
	}

	const topIndex = routes.length - 1;
	const topRoute = routes[topIndex];
	const topIsClosing =
		topRoute !== undefined && closingRouteKeys.has(topRoute.key);

	return {
		focusedIndex,
		topIndex,
		topIsClosing,
	};
};

const withDescriptorActivityState = <TDescriptor extends BaseStackDescriptor>(
	descriptor: StackDescriptorSource<TDescriptor>,
	activity: StackSceneActivity,
): TDescriptor => {
	if (descriptor.activity === activity) {
		return descriptor as TDescriptor;
	}

	return {
		...descriptor,
		activity,
	} as TDescriptor;
};

const buildBaseScenes = <
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>({
	routes,
	descriptors,
	closingRouteKeys,
	previousState,
	activityWindow,
}: BuildManagedStackStateParams<TDescriptor, TNavigation> & {
	activityWindow: SceneActivityWindow;
}) => {
	const routeKeys: string[] = [];
	const scenes: BaseStackScene<TDescriptor>[] = [];
	const routeChildStates: Record<string, unknown> = {};
	const sourceDescriptors = {} as ManagedDescriptorSources<TDescriptor>;
	const managedDescriptors = {} as ManagedDescriptors<TDescriptor>;
	let shouldShowFloatOverlay = false;

	for (let sceneIndex = 0; sceneIndex < routes.length; sceneIndex++) {
		const route = routes[sceneIndex] as TDescriptor["route"];

		const rawSourceDescriptor = descriptors[route.key] as
			| StackDescriptorSource<TDescriptor>
			| undefined;

		if (!rawSourceDescriptor) {
			throw new Error(`Missing descriptor for route "${route.key}"`);
		}

		const routeChildState = getRouteChildState(route);
		const childStateUnchanged =
			!previousState ||
			Object.is(previousState.routeChildStates[route.key], routeChildState);

		const sourceDescriptor = childStateUnchanged
			? resolveStableDescriptorSource({
					routeKey: route.key,
					sourceDescriptor: rawSourceDescriptor,
					previousState,
				})
			: rawSourceDescriptor;

		const activity = getSceneActivity({
			...activityWindow,
			isClosing: closingRouteKeys.has(route.key),
			sceneIndex,
		});

		const previousDescriptor = previousState?.descriptors[route.key];
		const descriptor =
			previousDescriptor &&
			childStateUnchanged &&
			previousDescriptor.route === sourceDescriptor.route &&
			previousDescriptor.navigation === sourceDescriptor.navigation &&
			previousDescriptor.options === sourceDescriptor.options &&
			previousDescriptor.activity === activity
				? previousDescriptor
				: withDescriptorActivityState(sourceDescriptor, activity);

		routeKeys.push(route.key);
		routeChildStates[route.key] = routeChildState;
		sourceDescriptors[route.key] = sourceDescriptor;
		managedDescriptors[route.key] = descriptor;

		if (!shouldShowFloatOverlay) {
			shouldShowFloatOverlay = isOverlayVisible(sourceDescriptor?.options);
		}

		scenes.push({
			route: descriptor.route,
			descriptor,
		});
	}

	return {
		scenes,
		routeChildStates,
		sourceDescriptors,
		descriptors: managedDescriptors,
		routeKeys,
		shouldShowFloatOverlay,
	};
};

const withSceneRelationships = <TDescriptor extends BaseStackDescriptor>({
	scenes,
	sourceDescriptors,
	closingRouteKeys,
	previousState,
}: {
	scenes: BaseStackScene<TDescriptor>[];
	sourceDescriptors: ManagedDescriptorSources<TDescriptor>;
	closingRouteKeys: ReadonlySet<string>;
	previousState?: LocalRoutesState<TDescriptor>;
}): BaseStackScene<TDescriptor>[] => {
	const isRouteClosing = (routeKey: string) => closingRouteKeys.has(routeKey);

	const closingRouteOrder = new Map(
		Array.from(closingRouteKeys, (routeKey, index) => [routeKey, index]),
	);

	const previousScenesByRouteKey = previousState
		? new Map(previousState.scenes.map((scene) => [scene.route.key, scene]))
		: undefined;

	let reusedEveryScene =
		previousState !== undefined &&
		scenes.length === previousState.scenes.length;

	const relationshipScenes = scenes.map((scene) => ({
		route: scene.route,
		descriptor: (sourceDescriptors[scene.route.key] ??
			scene.descriptor) as TDescriptor,
	}));

	const nextScenes = scenes.map((scene, sceneIndex) => {
		const { previousDescriptor, nextDescriptor } = resolveSceneNeighbors(
			relationshipScenes,
			sceneIndex,
			isRouteClosing,
			(routeKey) => closingRouteOrder.get(routeKey),
		);

		const nextScene = {
			...scene,
			previousDescriptor,
			nextDescriptor,
		};

		const previousScene =
			previousState?.scenes[sceneIndex]?.route === scene.route
				? previousState.scenes[sceneIndex]
				: previousScenesByRouteKey?.get(scene.route.key);

		// Keep row props stable when reconciliation leaves this route unchanged.
		if (
			previousScene &&
			previousScene.route === nextScene.route &&
			previousScene.descriptor === nextScene.descriptor &&
			previousScene.previousDescriptor === nextScene.previousDescriptor &&
			previousScene.nextDescriptor === nextScene.nextDescriptor
		) {
			return previousScene;
		}

		reusedEveryScene = false;
		return nextScene;
	});

	if (reusedEveryScene && previousState) {
		return previousState.scenes;
	}

	return nextScenes;
};

export const buildManagedStackState = <
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>(
	params: BuildManagedStackStateParams<TDescriptor, TNavigation>,
): LocalRoutesState<TDescriptor> => {
	const activityWindow = getSceneActivityWindow(params);
	const focusedRouteKey =
		params.props.state.routes[params.props.state.index]?.key;

	const {
		scenes: baseScenes,
		routeChildStates,
		sourceDescriptors,
		descriptors: managedDescriptors,
		routeKeys,
		shouldShowFloatOverlay,
	} = buildBaseScenes({
		...params,
		activityWindow,
	});

	const scenes = withSceneRelationships({
		scenes: baseScenes,
		sourceDescriptors,
		closingRouteKeys: params.closingRouteKeys,
		previousState: params.previousState,
	});

	const closingRouteKeys = new Set(params.closingRouteKeys);

	// Reuse derived collections that are logically unchanged; these are row
	// inputs, so stable references are part of reconciliation's output.
	return {
		routes: params.routes,
		descriptors:
			params.previousState &&
			areDescriptorsEqual(params.previousState.descriptors, managedDescriptors)
				? params.previousState.descriptors
				: managedDescriptors,
		sourceDescriptors:
			params.previousState &&
			areDescriptorsEqual(
				params.previousState.sourceDescriptors,
				sourceDescriptors,
			)
				? params.previousState.sourceDescriptors
				: sourceDescriptors,
		focusedRouteKey,
		routeChildStates:
			params.previousState &&
			areRouteChildStateMapsEqual(
				params.previousState.routeChildStates,
				routeChildStates,
			)
				? params.previousState.routeChildStates
				: routeChildStates,
		scenes,
		routeKeys:
			params.previousState &&
			areRouteKeysEqual(params.previousState.routeKeys, routeKeys)
				? params.previousState.routeKeys
				: routeKeys,
		shouldShowFloatOverlay,
		closingRouteKeys:
			params.previousState &&
			setsAreEqual(params.previousState.closingRouteKeys, closingRouteKeys)
				? params.previousState.closingRouteKeys
				: closingRouteKeys,
	};
};
