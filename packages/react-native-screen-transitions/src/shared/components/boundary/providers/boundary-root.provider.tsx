import { type ReactNode, useCallback, useMemo, useState } from "react";
import type { View } from "react-native";
import type { AnimatedRef, StyleProps } from "react-native-reanimated";
import { useAnimatedRef } from "react-native-reanimated";
import type { BoundsPortalHost, BoundTag } from "../../../stores/bounds/types";
import createProvider from "../../../utils/create-provider";
import { logger } from "../../../utils/logger";

interface BoundaryRootContextValue {
	registerTargetRef: (
		targetRef: AnimatedRef<View>,
		preparedStyles: StyleProps,
		measurementRef?: AnimatedRef<View>,
	) => void;
	unregisterTargetRef: (targetRef: AnimatedRef<View>) => void;
	activeTargetRef: AnimatedRef<View> | null;
	boundTag: BoundTag;
	portalHost?: BoundsPortalHost;
}

type BoundaryTargetEntry = {
	ref: AnimatedRef<View>;
	/** Surface to measure — the portal placeholder when content can teleport. */
	measurementRef: AnimatedRef<View>;
	preparedStyles: StyleProps;
};

// logger.warn prepends the library prefix.
const MULTIPLE_TARGETS_WARNING =
	"Multiple Boundary.Target elements were rendered under the same boundary root. The first registered target will be measured.";

export const TARGET_OUTSIDE_ROOT_WARNING =
	"Boundary.Target must be rendered inside Transition.Boundary or a component created by createBoundaryComponent.";

interface BoundaryRootProps {
	value: BoundaryRootContextValue;
	children: ReactNode;
}

export const { BoundaryRootProvider, useBoundaryRootContext } = createProvider(
	"BoundaryRoot",
	{ guarded: false },
)<BoundaryRootProps, BoundaryRootContextValue>((props) => props);

export const useBoundaryRootState = (params: {
	boundTag: BoundTag;
	portalHost?: BoundsPortalHost;
	rootMeasurementRef?: AnimatedRef<View>;
}) => {
	const { boundTag, portalHost, rootMeasurementRef } = params;
	const rootRef = useAnimatedRef<View>();
	const [targetEntry, setTargetEntry] = useState<BoundaryTargetEntry | null>(
		null,
	);

	const registerTargetRef = useCallback(
		(
			targetRef: AnimatedRef<View>,
			preparedStyles: StyleProps,
			measurementRef?: AnimatedRef<View>,
		) => {
			setTargetEntry((prev) => {
				if (prev?.ref === targetRef) {
					return prev;
				}

				if (__DEV__ && prev !== null) {
					logger.warnOnce(
						"boundary:multiple-targets",
						MULTIPLE_TARGETS_WARNING,
					);
				}

				return (
					prev ?? {
						ref: targetRef,
						measurementRef: measurementRef ?? targetRef,
						preparedStyles,
					}
				);
			});
		},
		[],
	);

	const unregisterTargetRef = useCallback((targetRef: AnimatedRef<View>) => {
		setTargetEntry((prev) => (prev?.ref === targetRef ? null : prev));
	}, []);

	const contextValue = useMemo(
		() => ({
			registerTargetRef,
			unregisterTargetRef,
			activeTargetRef: targetEntry?.ref ?? null,
			boundTag,
			portalHost,
		}),
		[registerTargetRef, unregisterTargetRef, targetEntry, boundTag, portalHost],
	);

	return {
		ref: rootRef,
		contextValue,
		hasActiveTarget: targetEntry !== null,
		measuredRef: targetEntry?.measurementRef ?? rootMeasurementRef ?? rootRef,
		targetPreparedStyles: targetEntry?.preparedStyles,
	};
};
