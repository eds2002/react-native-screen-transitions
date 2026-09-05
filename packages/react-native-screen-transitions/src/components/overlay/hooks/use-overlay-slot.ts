import { useWindowDimensions } from "react-native";
import {
	type SharedValue,
	useAnimatedProps,
	useAnimatedStyle,
	useDerivedValue,
} from "react-native-reanimated";
import { NO_PROPS, NO_STYLES } from "../../../constants";
import type { OrchestratorState } from "../../../providers/screen/orchestrator/orchestrator.provider";
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
	screenReady,
	isIncoming,
}: {
	overlayAnimationStore: OrchestratorState;
	overlayInterpolator: ScreenStyleInterpolator | undefined;
	driverAnimationStore: OrchestratorState;
	previousOverlayAnimationStore?: OrchestratorState;
	driverInterpolator: ScreenStyleInterpolator | undefined;
	screenReady: SharedValue<number>;
	isIncoming: boolean;
}) => {
	const { height } = useWindowDimensions();
	const overlaySlot = useDerivedValue<
		NormalizedTransitionSlotStyle | undefined
	>(() => {
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
		});
	});

	const animatedStyle = useAnimatedStyle(() => {
		"worklet";
		const slot = overlaySlot.get();
		if (!slot) {
			return NO_STYLES;
		}

		if (isIncoming && !screenReady.get()) {
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

		const { handoffTarget: _handoffTarget, ...props } = slotProps;

		return props;
	});

	return { animatedProps, animatedStyle };
};
