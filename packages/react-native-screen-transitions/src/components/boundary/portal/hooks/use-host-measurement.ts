import { useWindowDimensions, type View } from "react-native";
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
import { getVisibilityBlockOffset } from "../../../../utils/visibility-block-offset";
import { readLocalMeasurement } from "../../measure/local-measurements";
import {
	correctMeasuredBoundsForVisibilityGate,
	isScreenDrawnTooSmall,
} from "../../measure/measured-bounds";
import type { BoundaryLocalMeasurementValue } from "../../types";

const HOST_MEASUREMENT_RETRY_DELAY_MS = 16;
const MAX_HOST_MEASUREMENT_ATTEMPTS = 20;

type UseHostMeasurementParams = {
	enabled: boolean;
	boundaryMeasurements: BoundaryLocalMeasurementValue[];
};

export type HostBounds = MeasuredDimensions;

export const useHostMeasurement = ({
	enabled,
	boundaryMeasurements,
}: UseHostMeasurementParams) => {
	const { width: viewportWidth, height: viewportHeight } =
		useWindowDimensions();
	const hostRef = useAnimatedRef<View>();
	const hostBounds = useSharedValue<HostBounds | null>(null);
	const retryToken = useSharedValue(0);
	const attempts = useSharedValue(0);

	const measureHost = () => {
		"worklet";
		const count = attempts.get() + 1;
		attempts.set(count);
		const measured = measure(hostRef);
		// The host is as large as the screen: smaller than that, its screen is drawn (nearly) to
		// nothing, and the host is measured again (see MIN_MEASURABLE_SCREEN_SCALE).
		if (
			measured &&
			measured.height > 0 &&
			!isScreenDrawnTooSmall(measured.width, viewportWidth)
		) {
			// The host can still carry the preparation translation for one native
			// frame, even after JS readiness flips. Normalize the known gate offset
			// just like the boundary capture before subtracting page coordinates.
			const corrected = correctMeasuredBoundsForVisibilityGate({
				measured,
				isScreenReady: false,
				visibilityBlockOffset: getVisibilityBlockOffset(viewportHeight),
				viewportWidth,
				viewportHeight,
			});
			hostBounds.set(corrected);
		} else if (count < MAX_HOST_MEASUREMENT_ATTEMPTS) {
			retryToken.set(
				withDelay(
					HOST_MEASUREMENT_RETRY_DELAY_MS,
					withTiming(count, { duration: 0 }),
				),
			);
		}
	};

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return null;
			const captures = [];
			let hasSource = false;
			for (const value of boundaryMeasurements) {
				const capture = readLocalMeasurement(value);
				captures.push(capture);
				if (capture) hasSource = true;
			}
			return hasSource ? captures : null;
		},
		(captures) => {
			"worklet";
			cancelAnimation(retryToken);
			retryToken.set(0);
			attempts.set(0);
			hostBounds.set(null);
			// Measure anew on every source capture, even for the same portal/pair.
			// Hold only this transition's position; never reuse an earlier capture.
			if (captures) measureHost();
		},
	);

	useAnimatedReaction(
		() => retryToken.get(),
		(token) => {
			"worklet";
			if (token > 0) measureHost();
		},
	);

	return { hostBounds, hostRef };
};
