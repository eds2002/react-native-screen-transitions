import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import type { View } from "react-native";
import {
	measure,
	runOnJS,
	runOnUI,
	useAnimatedRef,
} from "react-native-reanimated";
import { ScrollStore } from "../../../../stores/scroll.store";
import { getVisibilityBlockOffset } from "../../../../utils/visibility-block-offset";
import {
	adjustedMeasuredBoundsForOverscrollDeltas,
	normalizeVisibilityBlockOffset,
} from "../../utils/measured-bounds";
import {
	clearPortalHostBounds,
	setPortalHostBounds,
} from "../stores/host-bounds.store";

type UseHostMeasurementParams = {
	capturesScroll: boolean;
	boundaryHostsRevision: string;
	hostKey: string;
	screenKey: string;
	viewportHeight: number;
};

export const useHostMeasurement = ({
	boundaryHostsRevision,
	capturesScroll,
	hostKey,
	screenKey,
	viewportHeight,
}: UseHostMeasurementParams) => {
	const hostRef = useAnimatedRef<View>();
	const scrollMetadata = ScrollStore.getValue(screenKey, "metadata");
	const [measuredBoundaryHostsRevision, setMeasuredBoundaryHostsRevision] =
		useState<string | null>(null);

	const measureHost = useCallback(
		(revision: string) => {
			runOnUI(
				(
					key: string,
					visibilityBlockOffset: number,
					shouldCaptureScroll: boolean,
					nextRevision: string,
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

					const normalizedMeasured = normalizeVisibilityBlockOffset(
						overscrollNormalized,
						visibilityBlockOffset,
					);

					setPortalHostBounds(key, {
						x: normalizedMeasured.x,
						y: normalizedMeasured.y,
						width: normalizedMeasured.width,
						height: normalizedMeasured.height,
						pageX: normalizedMeasured.pageX,
						pageY: normalizedMeasured.pageY,
						scroll: shouldCaptureScroll ? currentScroll : null,
					});

					runOnJS(setMeasuredBoundaryHostsRevision)(nextRevision);
				},
			)(
				hostKey,
				getVisibilityBlockOffset(viewportHeight),
				capturesScroll,
				revision,
			);
		},
		[capturesScroll, hostKey, hostRef, scrollMetadata, viewportHeight],
	);

	const onHostLayout = useCallback(() => {
		measureHost(boundaryHostsRevision);
	}, [boundaryHostsRevision, measureHost]);

	useEffect(() => {
		return () => {
			runOnUI(clearPortalHostBounds)(hostKey);
		};
	}, [hostKey]);

	// The revision is a deliberate trigger: re-measure whenever the concrete
	// boundary host set changes. Rendering against an older host frame can bake a
	// stale ScrollView offset into the portal's initial placement.
	useLayoutEffect(() => {
		setMeasuredBoundaryHostsRevision(null);
		measureHost(boundaryHostsRevision);
	}, [boundaryHostsRevision, measureHost]);

	return {
		canRenderHosts: measuredBoundaryHostsRevision === boundaryHostsRevision,
		hostRef,
		onHostLayout,
	};
};
