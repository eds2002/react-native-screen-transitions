import { useCallback, useEffect } from "react";
import {
	cancelAnimation,
	useAnimatedReaction,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import {
	abandonBoundaryMeasurement,
	getBoundaryMeasurementRequest,
} from "../../../../stores/bounds/internals/coordinator";
import { pairs } from "../../../../stores/bounds/internals/state";
import type { BoundTag } from "../../../../stores/bounds/types";
import { logger } from "../../../../utils/logger";
import type { MeasureBoundary, MeasureTarget } from "../../types";

const RETRY_DELAY_MS = 16;
const MAX_RETRIES = 20;

export const useBoundaryMeasurementRequest = (params: {
	enabled: boolean;
	boundTag: BoundTag;
	currentScreenKey: string;
	measureBoundary: MeasureBoundary;
}) => {
	const { enabled, boundTag, currentScreenKey, measureBoundary } = params;
	const retryClock = useSharedValue(0);

	const fulfillRequest = useCallback(
		function retry(request: MeasureTarget, attempt: number) {
			"worklet";
			if (!enabled) return;

			const pending = getBoundaryMeasurementRequest(
				boundTag.tag,
				currentScreenKey,
				pairs.get(),
			);
			if (
				pending?.type !== request.type ||
				pending.pairKey !== request.pairKey
			) {
				return;
			}

			if (measureBoundary(request)) return;

			if (attempt >= MAX_RETRIES) {
				abandonBoundaryMeasurement({ ...request, tag: boundTag.tag });
				logger.warn(
					`Boundary "${boundTag.tag}" on screen "${currentScreenKey}" could not complete its ${request.type} measurement after ${MAX_RETRIES} attempts; continuing without it.`,
				);
				return;
			}

			cancelAnimation(retryClock);
			retryClock.set(
				withDelay(
					RETRY_DELAY_MS,
					withTiming(retryClock.get() + 1, { duration: 0 }, (finished) => {
						if (finished) retry(request, attempt + 1);
					}),
				),
			);
		},
		[boundTag.tag, currentScreenKey, enabled, measureBoundary, retryClock],
	);

	useEffect(() => {
		return () => {
			cancelAnimation(retryClock);
		};
	}, [retryClock]);

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return null;
			// Read the mutable in the reaction itself. Hiding this read behind an
			// imported helper prevented the mapper from subscribing to pair changes,
			// so requests were only observed after a React refresh/remount.
			return getBoundaryMeasurementRequest(
				boundTag.tag,
				currentScreenKey,
				pairs.get(),
			);
		},
		(request, previousRequest) => {
			"worklet";
			if (
				!request ||
				(request.type === previousRequest?.type &&
					request.pairKey === previousRequest.pairKey)
			) {
				return;
			}

			fulfillRequest(request, 0);
		},
	);
};
