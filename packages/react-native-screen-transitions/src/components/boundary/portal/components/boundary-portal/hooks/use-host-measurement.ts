import type { View } from "react-native";
import {
	cancelAnimation,
	type MeasuredDimensions,
	measure,
	useAnimatedReaction,
	useAnimatedRef,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";

const HOST_MEASUREMENT_RETRY_DELAY_MS = 16;

type UseHostMeasurementParams = {
	measurementKey: string | null;
};

export const useHostMeasurement = ({
	measurementKey,
}: UseHostMeasurementParams) => {
	const hostRef = useAnimatedRef<View>();
	const hostBounds = useSharedValue<MeasuredDimensions | null>(null);
	const measuredKey = useSharedValue<string | null>(null);
	const retryToken = useSharedValue(0);

	useAnimatedReaction(
		() => {
			"worklet";
			if (!measurementKey) {
				return null;
			}

			return [measurementKey, measuredKey.get(), retryToken.get()] as const;
		},
		(state) => {
			"worklet";
			if (!state) {
				cancelAnimation(retryToken);
				return;
			}

			const [requestedKey, completedKey] = state;
			if (requestedKey === completedKey) {
				return;
			}

			const measured = measure(hostRef);

			if (!measured) {
				cancelAnimation(retryToken);
				retryToken.set(
					withDelay(
						HOST_MEASUREMENT_RETRY_DELAY_MS,
						withTiming(retryToken.get() + 1, { duration: 0 }),
					),
				);
				return;
			}

			cancelAnimation(retryToken);

			if (measured.width <= 0 || measured.height <= 0) {
				cancelAnimation(retryToken);
				retryToken.set(
					withDelay(
						HOST_MEASUREMENT_RETRY_DELAY_MS,
						withTiming(retryToken.get() + 1, { duration: 0 }),
					),
				);
				return;
			}

			hostBounds.set({
				x: measured.x,
				y: measured.y,
				width: measured.width,
				height: measured.height,
				pageX: measured.pageX,
				pageY: measured.pageY,
			});
			measuredKey.set(requestedKey);
		},
	);
	return {
		hostBounds,
		hostRef,
		measuredKey,
	};
};
