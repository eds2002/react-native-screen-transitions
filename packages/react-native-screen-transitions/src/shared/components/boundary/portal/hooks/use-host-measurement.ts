import { useLayoutEffect, useState } from "react";
import type { View } from "react-native";
import {
	measure,
	runOnJS,
	runOnUI,
	useAnimatedReaction,
	useAnimatedRef,
	useSharedValue,
} from "react-native-reanimated";
import { useOriginContext } from "../../../../providers/screen/origin.provider";
import { ScrollStore } from "../../../../stores/scroll.store";
import {
	adjustedMeasuredBoundsForOverscrollDeltas,
	normalizeMeasuredBoundsToOrigin,
} from "../../utils/measured-bounds";
import {
	clearPortalHostBounds,
	setPortalHostBounds,
} from "../stores/host-bounds.store";

type UseHostMeasurementParams = {
	capturesScroll: boolean;
	enabled: boolean;
	hostKey: string;
	screenKey: string;
};

export const useHostMeasurement = ({
	capturesScroll,
	enabled,
	hostKey,
	screenKey,
}: UseHostMeasurementParams) => {
	const hostRef = useAnimatedRef<View>();
	const scrollMetadata = ScrollStore.getValue(screenKey, "metadata");
	const [canRenderHosts, setCanRenderHosts] = useState<boolean>(false);
	const { originRef } = useOriginContext();
	const hasMeasuredHost = useSharedValue(false);

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) {
				return null;
			}

			return hasMeasuredHost.get();
		},
		(hasAlreadyMeasured) => {
			"worklet";
			if (!enabled || hasAlreadyMeasured) {
				return;
			}

			const measured = measure(hostRef);
			const measuredOrigin = measure(originRef);

			if (!measured || !measuredOrigin) {
				return;
			}

			hasMeasuredHost.set(true);

			// A measurement taken mid rubber-band would bake the transient
			// overscroll displacement into the host frame. Store the at-rest
			// position instead; clamped scroll deltas share that basis.
			const currentScroll = scrollMetadata.get();
			const overscrollNormalized = capturesScroll
				? adjustedMeasuredBoundsForOverscrollDeltas(measured, currentScroll)
				: measured;

			const normalizedMeasured = normalizeMeasuredBoundsToOrigin(
				overscrollNormalized,
				measuredOrigin,
			);

			setPortalHostBounds(hostKey, {
				x: normalizedMeasured.x,
				y: normalizedMeasured.y,
				width: normalizedMeasured.width,
				height: normalizedMeasured.height,
				pageX: normalizedMeasured.pageX,
				pageY: normalizedMeasured.pageY,
				scroll: capturesScroll ? currentScroll : null,
			});

			runOnJS(setCanRenderHosts)(true);
		},
	);

	useLayoutEffect(() => {
		return () => {
			runOnUI(clearPortalHostBounds)(hostKey);
		};
	}, [hostKey]);

	return {
		canRenderHosts,
		hostRef,
	};
};
