import type { BlankStackProviderProps } from "../../../../types/providers/blank-stack-provider.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackScene,
	StackDescriptorSource,
	StackSceneActivity,
} from "../../../../types/stack.types";
import { isOverlayVisible } from "../../../../utils/overlay/visibility";
import { resolveSceneNeighbors } from "./navigation/resolve-scene-neighbors";
import {
	areDescriptorSourcesEquivalent,
	areDescriptorsEqual,
	areRouteChildStateMapsEqual,
	getRouteChildState,
	routeKeyListsAreEqual,
	setsAreEqual,
} from "./state-equality";
import type {
	BlankStackDescriptorSources,
	BlankStackDescriptors,
	BlankStackRoutes,
	LocalRoutesState,
	SceneActivityWindow,
} from "./types";

type BuildBlankStackStateParams<
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
> = {
	props: BlankStackProviderProps<TDescriptor, TNavigation>;
	routes: BlankStackRoutes<TDescriptor>;
	descriptors: BlankStackDescriptorSources<TDescriptor>;
	closingRouteKeys: ReadonlySet<string>;
	previousState?: LocalRoutesState<TDescriptor>;
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

const getNonClosingSceneIndices = <TDescriptor extends BaseStackDescriptor>(
	routes: BlankStackRoutes<TDescriptor>,
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

const getSceneActivityWindow = <
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>({
	props,
	routes,
	closingRouteKeys,
}: BuildBlankStackStateParams<
	TDescriptor,
	TNavigation
>): SceneActivityWindow => {
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
}: BuildBlankStackStateParams<TDescriptor, TNavigation> & {
	activityWindow: SceneActivityWindow;
}) => {
	const routeKeys: string[] = [];
	const scenes: BaseStackScene<TDescriptor>[] = [];
	const routeChildStates: Record<string, unknown> = {};
	const sourceDescriptors = {} as BlankStackDescriptorSources<TDescriptor>;
	const blankStackDescriptors = {} as BlankStackDescriptors<TDescriptor>;
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
		blankStackDescriptors[route.key] = descriptor;

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
		descriptors: blankStackDescriptors,
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
	sourceDescriptors: BlankStackDescriptorSources<TDescriptor>;
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

export const buildBlankStackState = <
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>(
	params: BuildBlankStackStateParams<TDescriptor, TNavigation>,
): LocalRoutesState<TDescriptor> => {
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
		sourceDescriptors,
		closingRouteKeys: params.closingRouteKeys,
		previousState: params.previousState,
	});

	const closingRouteKeys = new Set(params.closingRouteKeys);

	return {
		routes: params.routes,
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
