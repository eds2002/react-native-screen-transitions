import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import { SystemStore } from "../../../../stores/system.store";
import type {
	NormalizedTransitionInterpolatedStyle,
	TransitionInterpolatedStyle,
} from "../../../../types/animation.types";
import { logger } from "../../../../utils/logger";
import { useScreenAnimationContext } from "../../animation";
import { useBuildBoundsAccessor } from "../../animation/helpers/accessors/use-build-bounds-accessor";
import { syncSelectedInterpolatorOptions } from "../../animation/helpers/selected-interpolator-options";
import { useDescriptorDerivations } from "../../descriptors";
import {
	syncScreenOptionsOverrides,
	useScreenOptionsContext,
} from "../../options";
import { normalizeSlots } from "../helpers/normalize-slots";
import { preserveAnimatedPropsOnly } from "../helpers/preserve-animated-props-only";
import { stripInterpolatorOptions } from "../helpers/strip-interpolator-options";

/**
 * Builds the raw interpolated styles map for the current screen pass.
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
 * The result stays as a single slot map. Resolution happens downstream, where
 * slot ids determine whether a slot may inherit from ancestors or must remain
 * local to the owning screen container.
 */
export const useInterpolatedStylesMap = () => {
	const { currentScreenKey } = useDescriptorDerivations();
	const screenOptions = useScreenOptionsContext();
	const {
		screenInterpolatorProps,
		screenInterpolatorPropsRevision,
		selectedInterpolatorOptions,
		nextInterpolator,
		currentInterpolator,
	} = useScreenAnimationContext();
	const boundsAccessor = useBuildBoundsAccessor();
	const pendingLifecycleStartBlockCount = SystemStore.getValue(
		currentScreenKey,
		"pendingLifecycleStartBlockCount",
	);

	const isGesturingDuringCloseAnimation = useSharedValue(false);

	return useDerivedValue<NormalizedTransitionInterpolatedStyle>(() => {
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
		const interpolator =
			interpolatorOptionsOwner === "current"
				? currentInterpolator
				: nextInterpolator;

		if (!interpolator) {
			syncSelectedInterpolatorOptions(selectedInterpolatorOptions, "current");
			syncScreenOptionsOverrides(undefined, screenOptions);
			return NO_STYLES;
		}

		let effectiveProgress = progress;
		let effectiveNext = next;

		if (isInGestureMode) {
			effectiveProgress = current.progress;
			effectiveNext = undefined;
		}

		try {
			const raw = interpolator({
				...props,
				progress: effectiveProgress,
				next: effectiveNext,
				bounds: boundsAccessor,
			});

			const rawStyleMap: TransitionInterpolatedStyle | undefined =
				typeof raw === "object" && raw != null ? raw : undefined;

			syncSelectedInterpolatorOptions(
				selectedInterpolatorOptions,
				interpolatorOptionsOwner,
				rawStyleMap?.options,
			);
			syncScreenOptionsOverrides(
				interpolatorOptionsOwner === "current" ? rawStyleMap : undefined,
				screenOptions,
			);

			const stylesMap = !rawStyleMap
				? NO_STYLES
				: normalizeSlots(stripInterpolatorOptions(rawStyleMap));

			return shouldDeferStyleBuckets
				? preserveAnimatedPropsOnly(stylesMap)
				: stylesMap;
		} catch (_) {
			if (__DEV__) {
				logger.warn("screenStyleInterpolator must be a worklet");
			}

			syncSelectedInterpolatorOptions(selectedInterpolatorOptions, "current");
			syncScreenOptionsOverrides(undefined, screenOptions);
			return NO_STYLES;
		}
	});
};
