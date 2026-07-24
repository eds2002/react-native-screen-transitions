import { useMemo } from "react";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import { AnimationStore } from "../../../../stores/animation.store";
import {
	LifecycleTransitionRequestKind,
	SystemStore,
} from "../../../../stores/system.store";
import type {
	NormalizedTransitionInterpolatedStyle,
	ScreenStyleInterpolator,
	TransitionInterpolatedStyle,
} from "../../../../types/animation.types";
import { logger } from "../../../../utils/logger";
import { useScreenAnimationStore } from "../../animation";
import { useBuildBoundsAccessor } from "../../animation/helpers/accessors/use-build-bounds-accessor";
import { useBuildTransitionAccessor } from "../../animation/helpers/accessors/use-build-transition-accessor";
import type { ScreenInterpolatorFrame } from "../../animation/helpers/pipeline";
import { readScreenAnimationRevisions } from "../../animation/helpers/read-screen-animation-revisions";
import { syncSelectedInterpolatorOptions } from "../../animation/helpers/selected-interpolator-options";
import { useDescriptorsStore } from "../../descriptors";
import {
	syncScreenOptionsOverrides,
	useScreenOptionsStore,
} from "../../options";
import { collectInterpolatorSharedValues } from "../helpers/collect-interpolator-shared-values";
import { normalizeSlots } from "../helpers/normalize-slots";
import type { LocalStyleLayers } from "../helpers/resolve-slot-styles";
import { stripInterpolatorOptions } from "../helpers/strip-interpolator-options";
import {
	hasCloseTransitionFinished,
	isOpenTransitionBlocked,
} from "../helpers/transition-visual-state";

const NO_STYLE_LAYERS: LocalStyleLayers = [];

type InterpolatorResult = {
	stylesMap: NormalizedTransitionInterpolatedStyle;
	rawStyleMap: TransitionInterpolatedStyle | undefined;
};

type RunInterpolatorParams = {
	interpolator: ScreenStyleInterpolator | undefined;
	props: ScreenInterpolatorFrame;
	progress: ScreenInterpolatorFrame["progress"];
	next: ScreenInterpolatorFrame["next"];
	bounds: Parameters<ScreenStyleInterpolator>[0]["bounds"];
	transition: Parameters<ScreenStyleInterpolator>[0]["transition"];
};

const normalizeRawStyleMap = (
	rawStyleMap: TransitionInterpolatedStyle | undefined,
) => {
	"worklet";

	if (!rawStyleMap) {
		return NO_STYLES;
	}

	const stylesMap = normalizeSlots(stripInterpolatorOptions(rawStyleMap));

	return stylesMap;
};

const runInterpolator = ({
	interpolator,
	props,
	progress,
	next,
	bounds,
	transition,
}: RunInterpolatorParams): InterpolatorResult | undefined => {
	"worklet";

	if (!interpolator) {
		return undefined;
	}

	try {
		const raw = interpolator({
			...props,
			progress,
			next,
			bounds,
			transition,
		});

		const rawStyleMap: TransitionInterpolatedStyle | undefined =
			typeof raw === "object" && raw != null ? raw : undefined;

		return {
			rawStyleMap,
			stylesMap: normalizeRawStyleMap(rawStyleMap),
		};
	} catch (_) {
		if (__DEV__) {
			logger.warn("screenStyleInterpolator must be a worklet");
		}

		return undefined;
	}
};

const appendLayer = (
	layers: LocalStyleLayers,
	result: InterpolatorResult | undefined,
) => {
	"worklet";

	if (result) {
		layers.push(result.stylesMap);
	}
};

/**
 * Builds the raw interpolated style layers for the current screen pass.
 *
 * This hook exists to stabilize style ownership during rapid navigation,
 * especially when an interactive close gesture overlaps with a new navigation
 * event. In flows like `A -> B`, begin closing `B`, then quickly open `C`,
 * the active route state can change before the gesture-driven close has
 * visually finished.
 *
 * If we immediately switch to the next interpolator in that window, styles can
 * be computed against the wrong route pair and leave layer or element slots
 * stranded in an intermediate state. We therefore latch onto the current
 * gesture interpolator for the lifetime of that close interaction, then resume
 * normal interpolator selection once the gesture-driven close is no longer in
 * play.
 *
 * The result is ordered from lowest to highest priority. Resolution happens
 * downstream, where slot ids determine whether slots inherit from ancestors and
 * where higher owner layers override lower owner layers per key.
 */
export const useInterpolatedStylesMap = () => {
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	const nextScreenKey = useDescriptorsStore((s) => s.derivations.nextScreenKey);
	const screenOptions = useScreenOptionsStore();
	const {
		screenInterpolatorProps,
		screenInterpolatorPropsRevision,
		selectedInterpolatorOptions,
		nextInterpolator,
		currentInterpolator,
		ancestorScreenAnimationSources,
		descendantScreenAnimationSources,
	} = useScreenAnimationStore();
	const boundsAccessor = useBuildBoundsAccessor();
	const transition = useBuildTransitionAccessor();
	const nextInterpolatorReady = useSharedValue(0);

	// In some cases, a user may want to use external shared values to drive animations in the interpoaltor.
	// We can now support this by collecting those shared values and reading them here to trigger an update.
	const interpolatorSharedValues = useMemo(
		() =>
			collectInterpolatorSharedValues([currentInterpolator, nextInterpolator]),
		[currentInterpolator, nextInterpolator],
	);

	const activeScreenKey = nextScreenKey ?? currentScreenKey;
	const { closing: activeClosing, entering: activeEntering } =
		AnimationStore.getBag(activeScreenKey);
	const {
		animationProgress: activeAnimationProgress,
		pendingLifecycleRequestKind: activePendingLifecycleRequestKind,
		pendingLifecycleStartBlockCount: activePendingLifecycleStartBlockCount,
	} = SystemStore.getBag(activeScreenKey);

	const isGesturingDuringCloseAnimation = useSharedValue(false);

	const localStylesMaps = useDerivedValue<LocalStyleLayers>(() => {
		"worklet";
		readScreenAnimationRevisions(
			screenInterpolatorPropsRevision,
			ancestorScreenAnimationSources,
			descendantScreenAnimationSources,
			interpolatorSharedValues,
		);
		const props = screenInterpolatorProps.get();

		const { current, next, progress } = props;
		const isDragging = current.gesture.dragging;
		const isNextClosing = !!next?.closing;

		// Keep using the gesture-driven interpolator until the closing gesture has
		// fully released. This avoids switching style ownership mid-flight when a
		// new navigation event lands before the close interaction visually settles.
		if (isDragging && isNextClosing) {
			isGesturingDuringCloseAnimation.set(true);
		}

		if (!isDragging && !isNextClosing) {
			isGesturingDuringCloseAnimation.set(false);
		}

		const isInGestureMode =
			!!isDragging || isGesturingDuringCloseAnimation.get();

		// Interpolator ownership changes only at visual boundaries on the UI thread:
		// the next screen attaches after its blockers clear and progress starts, then
		// detaches once its closing progress has committed at zero. The downstream
		// resolver sees the owner disappear in this same graph and resets its styles
		// without waiting for React to remove the screen.
		const isPendingOpen =
			activePendingLifecycleRequestKind.get() ===
			LifecycleTransitionRequestKind.Open;
		const activeOpening = isPendingOpen || !!activeEntering.get();
		const isOpeningBlocked = isOpenTransitionBlocked({
			opening: activeOpening,
			pendingLifecycleStartBlockCount:
				activePendingLifecycleStartBlockCount.get(),
			animationProgress: activeAnimationProgress.get(),
		});
		const hasCloseFinished = hasCloseTransitionFinished({
			closing: activeClosing.get(),
			animationProgress: activeAnimationProgress.get(),
		});
		const currentOwnsInterpolator =
			isInGestureMode ||
			!nextInterpolator ||
			isOpeningBlocked ||
			hasCloseFinished;
		const nextReady = currentOwnsInterpolator ? 0 : 1;

		nextInterpolatorReady.set(nextReady);

		const interpolatorOptionsOwner = currentOwnsInterpolator
			? "current"
			: "next";

		let selectedProgress = progress;
		let selectedNext = next;

		if (isInGestureMode) {
			selectedProgress = current.progress;
			selectedNext = undefined;
		}

		const currentResult = runInterpolator({
			interpolator: currentInterpolator,
			props,
			progress: selectedProgress,
			next: selectedNext,
			bounds: boundsAccessor,
			transition,
		});

		if (interpolatorOptionsOwner === "current") {
			syncSelectedInterpolatorOptions(
				selectedInterpolatorOptions,
				"current",
				currentResult?.rawStyleMap?.options,
			);
			syncScreenOptionsOverrides(currentResult?.rawStyleMap, screenOptions);

			if (!currentResult) {
				return NO_STYLE_LAYERS;
			}

			return [currentResult.stylesMap];
		}

		const nextResult = runInterpolator({
			interpolator: nextInterpolator,
			props,
			progress: selectedProgress,
			next: selectedNext,
			bounds: boundsAccessor,
			transition,
		});

		syncSelectedInterpolatorOptions(
			selectedInterpolatorOptions,
			"next",
			nextResult?.rawStyleMap?.options,
		);
		syncScreenOptionsOverrides(undefined, screenOptions);

		const layers: LocalStyleLayers = [];

		appendLayer(layers, currentResult);
		appendLayer(layers, nextResult);

		if (layers.length === 0) {
			return NO_STYLE_LAYERS;
		}

		return layers;
	});

	return {
		localStylesMaps,
		nextInterpolatorReady,
	};
};
