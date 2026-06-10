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
import { applyVisibilityBlockOffset } from "../../../create-boundary-component/utils/measured-bounds";
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

				const normalizedMeasured = shouldBlockVisibility.get()
					? applyVisibilityBlockOffset(measured, visibilityBlockOffset)
					: measured;

				setPortalHostBounds(key, {
					x: normalizedMeasured.x,
					y: normalizedMeasured.y,
					width: normalizedMeasured.width,
					height: normalizedMeasured.height,
					pageX: normalizedMeasured.pageX,
					pageY: normalizedMeasured.pageY,
					scroll: shouldCaptureScroll ? scrollMetadata.get() : null,
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

	useLayoutEffect(() => {
		setCanRenderHosts(false);
		if (!hasBoundaryHosts) {
			measureHost();
			return;
		}

		measureHost();
	}, [hasBoundaryHosts, measureHost]);

	return {
		canRenderHosts,
		hostRef,
		onHostLayout,
	};
};
