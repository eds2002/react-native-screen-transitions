import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
	type SharedValue,
	useAnimatedProps,
	useAnimatedStyle,
	useDerivedValue,
} from "react-native-reanimated";
import { NO_PROPS, NO_STYLES } from "../../../constants";
import type { ScreenAnimationContextValue } from "../../../providers/screen/animation/animation.provider";
import { useBuildTransitionAccessor } from "../../../providers/screen/animation/helpers/accessors/use-build-transition-accessor";
import { collectInterpolatorSharedValues } from "../../../providers/screen/styles/helpers/collect-interpolator-shared-values";
import type {
	NormalizedTransitionSlotStyle,
	ScreenStyleInterpolator,
} from "../../../types/animation.types";
import { getVisibilityBlockOffset } from "../../../utils/visibility-block-offset";
import {
	createOverlayInterpolatorFrame,
	shouldUseOverlayGestureDriver,
} from "../helpers/create-overlay-interpolator-frame";
import { runOverlaySlotInterpolator } from "../helpers/run-overlay-slot-interpolator";

export const useOverlaySlot = ({
	overlayAnimationStore,
	overlayInterpolator,
	driverAnimationStore,
	previousOverlayAnimationStore,
	driverInterpolator,
	interpolatorReady,
	isIncoming,
}: {
	overlayAnimationStore: ScreenAnimationContextValue;
	overlayInterpolator: ScreenStyleInterpolator | undefined;
	driverAnimationStore: ScreenAnimationContextValue;
	previousOverlayAnimationStore?: ScreenAnimationContextValue;
	driverInterpolator: ScreenStyleInterpolator | undefined;
	interpolatorReady: SharedValue<number>;
	isIncoming: boolean;
}) => {
	const { height } = useWindowDimensions();
	const overlayTransition = useBuildTransitionAccessor(overlayAnimationStore);
	const driverTransition = useBuildTransitionAccessor(driverAnimationStore);

	const interpolatorSharedValues = useMemo(
		() =>
			collectInterpolatorSharedValues([
				overlayInterpolator,
				driverInterpolator,
			]),
		[overlayInterpolator, driverInterpolator],
	);

	const overlaySlot = useDerivedValue<
		NormalizedTransitionSlotStyle | undefined
	>(() => {
		"worklet";
		overlayAnimationStore.screenInterpolatorPropsRevision.get();
		driverAnimationStore.screenInterpolatorPropsRevision.get();
		previousOverlayAnimationStore?.screenInterpolatorPropsRevision.get();

		for (let index = 0; index < interpolatorSharedValues.length; index++) {
			interpolatorSharedValues[index]?.get();
		}

		const overlayFrame = overlayAnimationStore.screenInterpolatorProps.get();
		const driverFrame = driverAnimationStore.screenInterpolatorProps.get();
		const overlayOwnsGesture = shouldUseOverlayGestureDriver(
			overlayFrame,
			driverFrame,
		);
		const frame = createOverlayInterpolatorFrame({
			overlayFrame,
			driverFrame: overlayOwnsGesture ? overlayFrame : driverFrame,
			previousOverlayFrame:
				previousOverlayAnimationStore?.screenInterpolatorProps.get(),
		});

		return runOverlaySlotInterpolator({
			frame,
			interpolator: overlayOwnsGesture
				? overlayInterpolator
				: driverInterpolator,
			transition: overlayOwnsGesture ? overlayTransition : driverTransition,
		});
	});

	const animatedStyle = useAnimatedStyle(() => {
		"worklet";
		const slot = overlaySlot.get();
		if (!slot) {
			return NO_STYLES;
		}

		if (isIncoming && !interpolatorReady.get()) {
			return {
				transform: [{ translateY: getVisibilityBlockOffset(height) }],
			};
		}

		return slot.style ?? NO_STYLES;
	});

	const animatedProps = useAnimatedProps(() => {
		"worklet";
		const slotProps = overlaySlot.get()?.props;
		if (!slotProps) {
			return NO_PROPS;
		}

		const {
			pointerEvents: _pointerEvents,
			handoffTarget: _handoffTarget,
			...props
		} = slotProps;

		return props;
	});

	return { animatedProps, animatedStyle };
};
