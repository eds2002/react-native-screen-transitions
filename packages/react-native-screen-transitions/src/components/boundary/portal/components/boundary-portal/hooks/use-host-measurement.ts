import { useLayoutEffect, useState } from "react";
import type { View } from "react-native";
import {
	cancelAnimation,
	measure,
	type SharedValue,
	useAnimatedReaction,
	useAnimatedRef,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { useOriginStore } from "../../../../../../providers/screen/origin.provider";
import { ScrollStore } from "../../../../../../stores/scroll.store";
import { getVisibilityBlockOffset } from "../../../../../../utils/visibility-block-offset";
import {
	adjustedMeasuredBoundsForOverscrollDeltas,
	isMeasurementInViewport,
	normalizeMeasuredBoundsWithVisibilityGate,
} from "../../../../utils/measured-bounds";
import {
	clearPortalHostBounds,
	setPortalHostBounds,
} from "../stores/host-bounds.store";

const HOST_MEASUREMENT_RETRY_DELAY_MS = 16;

type UseHostMeasurementParams = {
	capturesScroll: boolean;
	enabled: boolean;
	hostKey: string;
	screenKey: string;
	visibilityBlocked: SharedValue<boolean>;
	viewportHeight: number;
	viewportWidth: number;
};

export const useHostMeasurement = ({
	capturesScroll,
	enabled,
	hostKey,
	screenKey,
	visibilityBlocked,
	viewportHeight,
	viewportWidth,
}: UseHostMeasurementParams) => {
	const hostRef = useAnimatedRef<View>();
	const scrollMetadata = ScrollStore.getValue(screenKey, "metadata");
	const [canRenderHosts, setCanRenderHosts] = useState<boolean>(false);
	const originRef = useOriginStore((store) => store.originRef);
	const hasMeasuredHost = useSharedValue(false);
	const retryToken = useSharedValue(0);

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) {
				return null;
			}

			return [hasMeasuredHost.get(), retryToken.get()] as const;
		},
		(state) => {
			"worklet";
			if (!state) {
				cancelAnimation(retryToken);
				return;
			}

			const [hasAlreadyMeasured] = state;

			if (!enabled || hasAlreadyMeasured) {
				return;
			}

			const measured = measure(hostRef);
			const measuredOrigin = measure(originRef);

			if (!measured || !measuredOrigin) {
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
			hasMeasuredHost.set(true);

			// A measurement taken mid rubber-band would bake the transient
			// overscroll displacement into the host frame. Store the at-rest
			// position instead; clamped scroll deltas share that basis.
			const currentScroll = scrollMetadata.get();
			const overscrollNormalized = capturesScroll
				? adjustedMeasuredBoundsForOverscrollDeltas(measured, currentScroll)
				: measured;

			const normalizedMeasured = normalizeMeasuredBoundsWithVisibilityGate({
				measured: overscrollNormalized,
				origin: measuredOrigin,
				visibilityBlocked: visibilityBlocked.get(),
				visibilityBlockOffset: getVisibilityBlockOffset(viewportHeight),
				viewportWidth,
				viewportHeight,
			});

			if (
				!isMeasurementInViewport(
					normalizedMeasured,
					viewportWidth,
					viewportHeight,
				)
			) {
				cancelAnimation(retryToken);
				retryToken.set(
					withDelay(
						HOST_MEASUREMENT_RETRY_DELAY_MS,
						withTiming(retryToken.get() + 1, { duration: 0 }),
					),
				);
				return;
			}

			setPortalHostBounds(hostKey, {
				x: normalizedMeasured.x,
				y: normalizedMeasured.y,
				width: normalizedMeasured.width,
				height: normalizedMeasured.height,
				pageX: normalizedMeasured.pageX,
				pageY: normalizedMeasured.pageY,
				scroll: capturesScroll ? currentScroll : null,
			});

			scheduleOnRN(setCanRenderHosts, true);
		},
	);

	useLayoutEffect(() => {
		return () => {
			scheduleOnUI(clearPortalHostBounds, hostKey);
		};
	}, [hostKey]);

	return {
		canRenderHosts,
		hostRef,
	};
};
