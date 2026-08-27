import type { BlankStackDescriptor } from "../../../../types/blank-stack.types";
import type {
	BlankStackDescriptorSource,
	BlankStackDescriptorSources,
	BlankStackProviderProps,
} from "../../../../types/providers/blank-stack-provider.types";
import type {
	BaseStackScene,
	StackSceneActivity,
} from "../../../../types/stack.types";
import { isOverlayVisible } from "../../../../utils/overlay/visibility";
import { resolveSceneNeighbors } from "./navigation/resolve-scene-neighbors";
import {
	areDescriptorSourcesEquivalent,
	areDescriptorsEqual,
	areRecordsShallowEqual,
	areRouteChildStateMapsEqual,
	getRouteChildState,
	routeKeyListsAreEqual,
	setsAreEqual,
} from "./state-equality";
import type {
	BlankStackDescriptors,
	BlankStackRoutes,
	LocalRoutesState,
	SceneActivityWindow,
} from "./types";

type BuildBlankStackStateParams = {
	props: BlankStackProviderProps;
	routes: BlankStackRoutes;
	descriptors: BlankStackDescriptorSources;
	closingRouteKeys: ReadonlySet<string>;
	previousState?: LocalRoutesState;
};

const resolveStableDescriptorSource = ({
	routeKey,
	sourceDescriptor,
	previousState,
}: {
	routeKey: string;
	sourceDescriptor: BlankStackDescriptorSource;
	previousState?: LocalRoutesState;
}): BlankStackDescriptorSource => {
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
	activeIndex,
	inertIndex,
	isClosing,
	sceneIndex,
}: SceneActivityWindow & {
	isClosing: boolean;
	sceneIndex: number;
}): StackSceneActivity => {
	if (isClosing) {
		return "closing";
	}

	if (sceneIndex === activeIndex) {
		return "active";
	}

	if (sceneIndex === inertIndex) {
		return "inert";
	}

	return "inactive";
};

const getNonClosingSceneIndices = (
	routes: BlankStackRoutes,
	closingRouteKeys: ReadonlySet<string>,
) => {
	const indices: number[] = [];

	for (let index = 0; index < routes.length; index++) {
		const route = routes[index];
		if (route && !closingRouteKeys.has(route.key)) {
			indices.push(index);
		}
	}

	return indices;
};

const getSceneActivityWindow = ({
	props,
	routes,
	closingRouteKeys,
}: BuildBlankStackStateParams): SceneActivityWindow => {
	const nonClosingIndices = getNonClosingSceneIndices(routes, closingRouteKeys);

	const topNonClosingIndex =
		nonClosingIndices[nonClosingIndices.length - 1] ?? -1;

	const hasClosingRouteAboveActive =
		topNonClosingIndex !== -1 && topNonClosingIndex < routes.length - 1;

	const activeIndex = hasClosingRouteAboveActive ? -1 : topNonClosingIndex;
	const inertIndex = hasClosingRouteAboveActive
		? topNonClosingIndex
		: (nonClosingIndices[nonClosingIndices.length - 2] ?? -1);

	const focusedRouteKey = props.state.routes[props.state.index]?.key;
	if (
		focusedRouteKey &&
		!routes.some((route) => route.key === focusedRouteKey)
	) {
		throw new Error(
			`Focused route "${focusedRouteKey}" is missing from routes`,
		);
	}

	return {
		activeIndex,
		inertIndex,
	};
};

const buildBaseScenes = ({
	props,
	routes,
	descriptors,
	closingRouteKeys,
	previousState,
	activityWindow,
}: BuildBlankStackStateParams & {
	activityWindow: SceneActivityWindow;
}) => {
	const routeKeys: string[] = [];
	const scenes: BaseStackScene<BlankStackDescriptor>[] = [];
	const routeChildStates: Record<string, unknown> = {};
	const sourceDescriptors: BlankStackDescriptorSources = {};
	const blankStackDescriptors: BlankStackDescriptors = {};
	let shouldShowFloatOverlay = false;

	for (let sceneIndex = 0; sceneIndex < routes.length; sceneIndex++) {
		const route = routes[sceneIndex] as BlankStackDescriptor["route"];

		const rawSourceDescriptor = descriptors[route.key];

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
		const descriptorRoute =
			previousDescriptor &&
			childStateUnchanged &&
			areRecordsShallowEqual(
				previousDescriptor.route as unknown as Record<string, unknown>,
				route as unknown as Record<string, unknown>,
			)
				? previousDescriptor.route
				: route;
		const descriptor =
			previousDescriptor &&
			childStateUnchanged &&
			previousDescriptor.route === descriptorRoute &&
			previousDescriptor.navigation === props.navigation &&
			previousDescriptor.options === sourceDescriptor.options
				? previousDescriptor
				: ({
						route: descriptorRoute,
						navigation: props.navigation,
						options: sourceDescriptor.options,
						render: sourceDescriptor.render,
					} as BlankStackDescriptor);

		routeKeys.push(route.key);
		routeChildStates[route.key] = routeChildState;
		sourceDescriptors[route.key] = sourceDescriptor;
		blankStackDescriptors[route.key] = descriptor;

		if (!shouldShowFloatOverlay) {
			shouldShowFloatOverlay = isOverlayVisible(sourceDescriptor?.options);
		}

		scenes.push({
			activity,
			route: descriptor.route,
			descriptor,
		});
	}

	return {
		scenes,
		routeChildStates,
		sourceDescriptors,
		descriptors: blankStackDescriptors,
		routeKeys,
		shouldShowFloatOverlay,
	};
};

const withSceneRelationships = ({
	scenes,
	closingRouteKeys,
	previousState,
}: {
	scenes: BaseStackScene<BlankStackDescriptor>[];
	closingRouteKeys: ReadonlySet<string>;
	previousState?: LocalRoutesState;
}): BaseStackScene<BlankStackDescriptor>[] => {
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
		descriptor: scene.descriptor,
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

		if (
			previousScene &&
			previousScene.activity === nextScene.activity &&
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

export const buildBlankStackState = (
	params: BuildBlankStackStateParams,
): LocalRoutesState => {
	const activityWindow = getSceneActivityWindow(params);
	const focusedRouteKey =
		params.props.state.routes[params.props.state.index]?.key;

	const {
		scenes: baseScenes,
		routeChildStates,
		sourceDescriptors,
		descriptors: blankStackDescriptors,
		routeKeys,
		shouldShowFloatOverlay,
	} = buildBaseScenes({
		...params,
		activityWindow,
	});

	const scenes = withSceneRelationships({
		scenes: baseScenes,
		closingRouteKeys: params.closingRouteKeys,
		previousState: params.previousState,
	});

	const closingRouteKeys = new Set(params.closingRouteKeys);

	return {
		routes: params.routes,
		navigation: params.props.navigation,
		descriptors:
			params.previousState &&
			areDescriptorsEqual(
				params.previousState.descriptors,
				blankStackDescriptors,
			)
				? params.previousState.descriptors
				: blankStackDescriptors,
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
			routeKeyListsAreEqual(params.previousState.routeKeys, routeKeys)
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
