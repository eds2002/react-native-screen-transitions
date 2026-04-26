import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import { SystemStore } from "../../../../stores/system.store";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../types/animation.types";
import { logger } from "../../../../utils/logger";
import { useScreenAnimationContext } from "../../animation";
import { useDescriptorDerivations } from "../../descriptors";
import { normalizeSlots } from "../helpers/normalize-slots";

export const useInterpolatedStylesMap = () => {
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

	return useDerivedValue<NormalizedTransitionInterpolatedStyle>(() => {
		"worklet";
		if (pendingLifecycleStartBlockCount.get() > 0) {
			return NO_STYLES;
		}

		const props = screenInterpolatorProps.get();
		const { current, next, progress } = props;
		const isDragging = current.gesture.dragging;
		const isNextClosing = !!next?.closing;

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

			const stylesMap =
				typeof raw !== "object" || raw == null
					? NO_STYLES
					: normalizeSlots(raw);

			return stylesMap;
		} catch (_) {
			if (__DEV__) {
				logger.warn("screenStyleInterpolator must be a worklet");
			}

			return NO_STYLES;
		}
	});
};
