import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import { SystemStore } from "../../../../stores/system.store";
import type {
	NormalizedTransitionInterpolatedStyle,
	ScreenStyleInterpolator,
	TransitionInterpolatedStyle,
} from "../../../../types/animation.types";
import { logger } from "../../../../utils/logger";
import { useScreenAnimationStore } from "../../animation";
import { useBuildBoundsAccessor } from "../../animation/helpers/accessors/use-build-bounds-accessor";
import type { ScreenInterpolatorFrame } from "../../animation/helpers/pipeline";
import { syncSelectedInterpolatorOptions } from "../../animation/helpers/selected-interpolator-options";
import { useDescriptorsStore } from "../../descriptors";
import {
	syncScreenOptionsOverrides,
	useScreenOptionsStore,
} from "../../options";
import { normalizeSlots } from "../helpers/normalize-slots";
import { preserveAnimatedPropsOnly } from "../helpers/preserve-animated-props-only";
import type { LocalStyleLayers } from "../helpers/resolve-slot-styles";
import { stripInterpolatorOptions } from "../helpers/strip-interpolator-options";

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
	shouldDeferStyleBuckets: boolean;
};

const normalizeRawStyleMap = (
	rawStyleMap: TransitionInterpolatedStyle | undefined,
	shouldDeferStyleBuckets: boolean,
) => {
	"worklet";

	if (!rawStyleMap) {
		return NO_STYLES;
	}

	const stylesMap = normalizeSlots(stripInterpolatorOptions(rawStyleMap));

	return shouldDeferStyleBuckets
		? preserveAnimatedPropsOnly(stylesMap)
		: stylesMap;
};

const runInterpolator = ({
	interpolator,
	props,
	progress,
	next,
	bounds,
	shouldDeferStyleBuckets,
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
		});

		const rawStyleMap: TransitionInterpolatedStyle | undefined =
			typeof raw === "object" && raw != null ? raw : undefined;

		return {
			rawStyleMap,
			stylesMap: normalizeRawStyleMap(rawStyleMap, shouldDeferStyleBuckets),
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
 * Visibility gating happens downstream while lifecycle start is blocked for
 * pending destination measurement. We still run the interpolator during that
 * hidden window so animated props and runtime options stay warm, but defer style
 * buckets so measurement sees the final untransformed layout.
 *
 * The result is ordered from lowest to highest priority. Resolution happens
 * downstream, where slot ids determine whether slots inherit from ancestors and
 * where higher owner layers override lower owner layers per key.
 */
export const useInterpolatedStylesMap = () => {
	const currentScreenKey = useDescriptorsStore(
		(store) => store.derivations.currentScreenKey,
	);
	const screenOptions = useScreenOptionsStore((store) => store);
	const screenInterpolatorProps = useScreenAnimationStore(
		(store) => store.screenInterpolatorProps,
	);
	const screenInterpolatorPropsRevision = useScreenAnimationStore(
		(store) => store.screenInterpolatorPropsRevision,
	);
	const selectedInterpolatorOptions = useScreenAnimationStore(
		(store) => store.selectedInterpolatorOptions,
	);
	const nextInterpolator = useScreenAnimationStore(
		(store) => store.nextInterpolator,
	);
	const currentInterpolator = useScreenAnimationStore(
		(store) => store.currentInterpolator,
	);
	const boundsAccessor = useBuildBoundsAccessor();
	const pendingLifecycleStartBlockCount = SystemStore.getValue(
		currentScreenKey,
		"pendingLifecycleStartBlockCount",
	);

	const isGesturingDuringCloseAnimation = useSharedValue(false);

	return useDerivedValue<LocalStyleLayers>(() => {
		"worklet";
		screenInterpolatorPropsRevision.get();
		const props = screenInterpolatorProps.get();

		/**
		 * There is a niche case where bounds can be attached to a view that's styles are out of viewport.
		 * Due to our blocking mechanism and ensuring accurate measurement, this boundary measurement
		 * will be blocked and the screen will never be visible. To mitigate this, we:
		 *
		 * - Defer the style buckets (props are fine), to ensure we get the correct position of the boundary
		 *
		 * Again this is very niche, and since we're not marketing ourselves as a proper shared element transition
		 * package, we won't spend time finding a better solution for this.
		 *
		 */
		const shouldDeferStyleBuckets = pendingLifecycleStartBlockCount.get() > 0;

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

		const interpolatorOptionsOwner =
			isInGestureMode || !nextInterpolator ? "current" : "next";

		let effectiveProgress = progress;
		let effectiveNext = next;

		if (isInGestureMode) {
			effectiveProgress = current.progress;
			effectiveNext = undefined;
		}

		const currentResult = runInterpolator({
			interpolator: currentInterpolator,
			props,
			progress: effectiveProgress,
			next: effectiveNext,
			bounds: boundsAccessor,
			shouldDeferStyleBuckets,
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
			progress: effectiveProgress,
			next: effectiveNext,
			bounds: boundsAccessor,
			shouldDeferStyleBuckets,
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
};
