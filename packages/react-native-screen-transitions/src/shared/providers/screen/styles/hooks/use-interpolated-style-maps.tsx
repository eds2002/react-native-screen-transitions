import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import { SystemStore } from "../../../../stores/system.store";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../types/animation.types";
import { logger } from "../../../../utils/logger";
import { normalizeInterpolatedStyle } from "../../../../utils/normalize-interpolated-style";
import { useScreenAnimationContext } from "../../animation";
import { useDescriptorDerivations } from "../../descriptors";
import { splitNormalizedStyleMaps } from "../helpers/split-normalized-style-maps";

type InterpolatedStyleMaps = {
	layerStylesMap: NormalizedTransitionInterpolatedStyle;
	elementStylesMap: NormalizedTransitionInterpolatedStyle;
};

/**
 * Builds the raw interpolated style maps for the current screen pass.
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
 * The hook also suppresses interpolated styles while lifecycle start is blocked
 * for pending destination measurement. That keeps the opening screen visually
 * neutral until the system has a usable viewport measurement, then allows the
 * interpolator to take over once the blocker clears.
 *
 * The result stays split into layer and element slots because they have
 * different resolution rules downstream: element slots may inherit from a
 * parent styles provider, while layer slots must stay local to the owning
 * screen container.
 */
export const useInterpolatedStyleMaps = () => {
	const { currentScreenKey } = useDescriptorDerivations();
	const {
		screenInterpolatorProps,
		nextInterpolator,
		currentInterpolator,
		boundsAccessor,
	} = useScreenAnimationContext();

	const pendingLifecycleStartBlockCount = SystemStore.getValue(
		currentScreenKey,
		"pendingLifecycleStartBlockCount",
	);

	const isGesturingDuringCloseAnimation = useSharedValue(false);

	return useDerivedValue<InterpolatedStyleMaps>(() => {
		"worklet";
		if (pendingLifecycleStartBlockCount.get() > 0) {
			return {
				layerStylesMap: NO_STYLES,
				elementStylesMap: NO_STYLES,
			};
		}

		const props = screenInterpolatorProps.value;
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

		const isInGestureMode = isDragging || isGesturingDuringCloseAnimation.get();

		const interpolator = isInGestureMode
			? currentInterpolator
			: (nextInterpolator ?? currentInterpolator);

		if (!interpolator) {
			return {
				layerStylesMap: NO_STYLES,
				elementStylesMap: NO_STYLES,
			};
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

			const stylesMap =
				typeof raw !== "object" || raw == null
					? NO_STYLES
					: normalizeInterpolatedStyle(raw);

			const { layerStylesMap, elementStylesMap } =
				splitNormalizedStyleMaps(stylesMap);

			return {
				layerStylesMap,
				elementStylesMap,
			};
		} catch (_) {
			if (__DEV__) {
				logger.warn("screenStyleInterpolator must be a worklet");
			}

			return {
				layerStylesMap: NO_STYLES,
				elementStylesMap: NO_STYLES,
			};
		}
	});
};
