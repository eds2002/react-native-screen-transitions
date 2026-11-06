import { useWindowDimensions, type View } from "react-native";
import {
	cancelAnimation,
	type MeasuredDimensions,
	measure,
	type SharedValue,
	useAnimatedReaction,
	useAnimatedRef,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import type { ScrollChainLink } from "../../../../providers/motion/gestures/scroll-coordination";
import {
	type ScrollChainSnapshot,
	snapshotScrollChain,
} from "../../../../stores/scroll.store";
import type { ScrollMetadataState } from "../../../../types/gesture.types";
import { getVisibilityBlockOffset } from "../../../../utils/visibility-block-offset";
import type { BoundaryLocalMeasurementValue } from "../../types";
import { correctMeasuredBoundsForVisibilityGate } from "../../utils/measured-bounds";

const HOST_MEASUREMENT_RETRY_DELAY_MS = 16;
const MAX_HOST_MEASUREMENT_ATTEMPTS = 20;

type UseHostMeasurementParams = {
	enabled: boolean;
	boundaryMeasurements: BoundaryLocalMeasurementValue[];
	/** The screen's scroll metadata and the scroll views around the host (an explicit host can scroll). */
	scrollMetadata: SharedValue<ScrollMetadataState | null>;
	scrollChain: readonly ScrollChainLink[];
};

export type HostBounds = MeasuredDimensions & {
	scrollChain?: ScrollChainSnapshot[];
};

export const useHostMeasurement = ({
	enabled,
	boundaryMeasurements,
	scrollMetadata,
	scrollChain,
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
		if (measured && measured.width > 0 && measured.height > 0) {
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
			// A host inside scroll views (an explicit Boundary.Host) scrolls too: record where.
			const hostScroll = snapshotScrollChain(scrollMetadata.get(), scrollChain);
			hostBounds.set(
				hostScroll.length
					? { ...corrected, scrollChain: hostScroll }
					: corrected,
			);
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
				const capture = value.get();
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
