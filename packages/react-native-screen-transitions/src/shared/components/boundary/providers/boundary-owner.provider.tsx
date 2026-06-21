import type React from "react";
import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import type { View } from "react-native";
import type Animated from "react-native-reanimated";
import type { AnimatedRef, StyleProps } from "react-native-reanimated";
import createProvider from "../../../utils/create-provider";
import { logger } from "../../../utils/logger";
import type { BoundaryPortal } from "../types";

type BoundaryAssociatedStyle = React.ComponentProps<
	typeof Animated.View
>["style"];

interface BoundaryOwnerContextValue {
	ownerRef: AnimatedRef<View>;
	registerTargetRef: (
		targetRef: AnimatedRef<View>,
		preparedStyles: StyleProps,
		measurementRef?: AnimatedRef<View>,
	) => void;
	unregisterTargetRef: (targetRef: AnimatedRef<View>) => void;
	activeTargetRef: AnimatedRef<View> | null;
	associatedTargetStyles?: BoundaryAssociatedStyle;
	entryTag: string;
	portal?: BoundaryPortal;
}

type BoundaryTargetEntry = {
	ref: AnimatedRef<View>;
	/** Surface to measure — the portal placeholder when content can teleport. */
	measurementRef: AnimatedRef<View>;
	preparedStyles: StyleProps;
};

// logger.warn prepends the library prefix.
const MULTIPLE_TARGETS_WARNING =
	"Multiple Boundary.Target elements were rendered under the same boundary owner. The first registered target will be measured.";

export const TARGET_OUTSIDE_OWNER_WARNING =
	"Boundary.Target must be rendered inside a Boundary owner (Boundary.View, Boundary.Trigger, or a component created by createBoundaryComponent).";

interface BoundaryOwnerProps {
	value: BoundaryOwnerContextValue;
	children: ReactNode;
}

export const { BoundaryOwnerProvider, useBoundaryOwnerContext } =
	createProvider("BoundaryOwner", { guarded: false })<
		BoundaryOwnerProps,
		BoundaryOwnerContextValue
	>((props) => props);

export const useBoundaryOwner = (params: {
	ownerRef: AnimatedRef<View>;
	associatedTargetStyles?: BoundaryAssociatedStyle;
	entryTag: string;
	portal?: BoundaryPortal;
}) => {
	const { ownerRef, associatedTargetStyles, entryTag, portal } = params;
	const warnedAboutMultipleTargetsRef = useRef(false);
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

				if (
					__DEV__ &&
					prev !== null &&
					!warnedAboutMultipleTargetsRef.current
				) {
					warnedAboutMultipleTargetsRef.current = true;
					logger.warn(MULTIPLE_TARGETS_WARNING);
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
			ownerRef,
			registerTargetRef,
			unregisterTargetRef,
			activeTargetRef: targetEntry?.ref ?? null,
			associatedTargetStyles,
			entryTag,
			portal,
		}),
		[
			ownerRef,
			registerTargetRef,
			unregisterTargetRef,
			targetEntry,
			associatedTargetStyles,
			entryTag,
			portal,
		],
	);

	return {
		contextValue,
		hasActiveTarget: targetEntry !== null,
		measuredRef: targetEntry?.measurementRef ?? ownerRef,
		targetPreparedStyles: targetEntry?.preparedStyles,
		portal,
	};
};
