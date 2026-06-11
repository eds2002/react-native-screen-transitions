import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import type { View } from "react-native";
import {
	measure,
	runOnJS,
	runOnUI,
	useAnimatedRef,
} from "react-native-reanimated";
import { useScreenStyles } from "../../../../providers/screen/styles";
import { ScrollStore } from "../../../../stores/scroll.store";
import { getVisibilityBlockOffset } from "../../../../utils/visibility-block-offset";
import {
	adjustedMeasuredBoundsForOverscrollDeltas,
	applyVisibilityBlockOffset,
} from "../../utils/measured-bounds";
import {
	clearPortalHostBounds,
	setPortalHostBounds,
} from "../stores/host-bounds.store";

type UseHostMeasurementParams = {
	capturesScroll: boolean;
	hasBoundaryHosts: boolean;
	hostKey: string;
	screenKey: string;
	viewportHeight: number;
};

export const useHostMeasurement = ({
	capturesScroll,
	hasBoundaryHosts,
	hostKey,
	screenKey,
	viewportHeight,
}: UseHostMeasurementParams) => {
	const { shouldBlockVisibility } = useScreenStyles();
	const hostRef = useAnimatedRef<View>();
	const scrollMetadata = ScrollStore.getValue(screenKey, "metadata");
	const [canRenderHosts, setCanRenderHosts] = useState(false);

	const measureHost = useCallback(() => {
		runOnUI(
			(
				key: string,
				visibilityBlockOffset: number,
				shouldCaptureScroll: boolean,
			) => {
				"worklet";
				const measured = measure(hostRef);
				if (!measured) {
					return;
				}

				// A measurement taken mid rubber-band would bake the transient
				// overscroll displacement into the host frame. Store the at-rest
				// position instead; clamped scroll deltas share that basis.
				const currentScroll = scrollMetadata.get();
				const overscrollNormalized = shouldCaptureScroll
					? adjustedMeasuredBoundsForOverscrollDeltas(measured, currentScroll)
					: measured;

				const normalizedMeasured = shouldBlockVisibility.get()
					? applyVisibilityBlockOffset(
							overscrollNormalized,
							visibilityBlockOffset,
						)
					: overscrollNormalized;

				setPortalHostBounds(key, {
					x: normalizedMeasured.x,
					y: normalizedMeasured.y,
					width: normalizedMeasured.width,
					height: normalizedMeasured.height,
					pageX: normalizedMeasured.pageX,
					pageY: normalizedMeasured.pageY,
					scroll: shouldCaptureScroll ? currentScroll : null,
				});

				runOnJS(setCanRenderHosts)(true);
			},
		)(hostKey, getVisibilityBlockOffset(viewportHeight), capturesScroll);
	}, [
		capturesScroll,
		hostKey,
		hostRef,
		scrollMetadata,
		shouldBlockVisibility,
		viewportHeight,
	]);

	const onHostLayout = useCallback(() => {
		measureHost();
	}, [measureHost]);

	useEffect(() => {
		return () => {
			runOnUI(clearPortalHostBounds)(hostKey);
		};
	}, [hostKey]);

	// hasBoundaryHosts is a deliberate trigger: re-measure whenever boundary
	// hosts attach to or detach from this host.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useLayoutEffect(() => {
		setCanRenderHosts(false);
		measureHost();
	}, [hasBoundaryHosts, measureHost]);

	return {
		canRenderHosts,
		hostRef,
		onHostLayout,
	};
};
