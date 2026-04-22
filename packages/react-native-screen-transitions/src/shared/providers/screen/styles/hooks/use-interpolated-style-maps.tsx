import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import { SystemStore } from "../../../../stores/system.store";
import type {
	NormalizedTransitionInterpolatedStyle,
	TransitionInterpolatedStyle,
} from "../../../../types/animation.types";
import { logger } from "../../../../utils/logger";
import { useScreenAnimationContext } from "../../animation";
import { useDescriptorDerivations } from "../../descriptors";
import { useGestureContext } from "../../gestures";
import { normalizeSlots } from "../helpers/normalize-slots";
import { stripInterpolatorConfig } from "../helpers/strip-interpolator-config";
import { syncGestureRuntimeOverrides } from "../helpers/sync-gesture-runtime-overrides";

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
 * The hook also suppresses interpolated styles while lifecycle start is blocked
 * for pending destination measurement. That keeps the opening screen visually
 * neutral until the system has a usable viewport measurement, then allows the
 * interpolator to take over once the blocker clears.
 *
 * The result stays as a single slot map. Resolution happens downstream, where
 * slot ids determine whether a slot may inherit from ancestors or must remain
 * local to the owning screen container.
 */
export const useInterpolatedStylesMap = () => {
	const { currentScreenKey } = useDescriptorDerivations();
	const gestureContext = useGestureContext();
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

	return useDerivedValue<NormalizedTransitionInterpolatedStyle>(() => {
		"worklet";
		if (pendingLifecycleStartBlockCount.get() > 0) {
			return NO_STYLES;
		}

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

		const interpolator = isInGestureMode
			? currentInterpolator
			: (nextInterpolator ?? currentInterpolator);

		if (!interpolator) {
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

			syncGestureRuntimeOverrides(rawStyleMap, gestureContext);

			const stylesMap = !rawStyleMap
				? NO_STYLES
				: normalizeSlots(stripInterpolatorConfig(rawStyleMap));

			return stylesMap;
		} catch (_) {
			if (__DEV__) {
				logger.warn("screenStyleInterpolator must be a worklet");
			}

			return NO_STYLES;
		}
	});
};
