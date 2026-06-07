import type React from "react";
import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import type { View } from "react-native";
import type Animated from "react-native-reanimated";
import type { AnimatedRef, StyleProps } from "react-native-reanimated";
import createProvider from "../../../utils/create-provider";
import { logger } from "../../../utils/logger";

type BoundaryAssociatedStyle = React.ComponentProps<
	typeof Animated.View
>["style"];

interface BoundaryOwnerContextValue {
	ownerRef: AnimatedRef<View>;
	registerTargetRef: (
		targetRef: AnimatedRef<View>,
		preparedStyles: StyleProps,
	) => void;
	unregisterTargetRef: (targetRef: AnimatedRef<View>) => void;
	activeTargetRef: AnimatedRef<View> | null;
	associatedTargetStyles?: BoundaryAssociatedStyle;
	entryTag: string;
	portal?: boolean;
}

type BoundaryTargetEntry = {
	ref: AnimatedRef<View>;
	preparedStyles: StyleProps;
};

const MULTIPLE_TARGETS_WARNING =
	"[react-native-screen-transitions] Multiple Boundary.Target elements were rendered under the same boundary owner. The first registered target will be measured.";

export const TARGET_OUTSIDE_OWNER_WARNING =
	"[react-native-screen-transitions] Boundary.Target must be rendered inside a Boundary owner (Boundary.View, Boundary.Trigger, or a component created by createBoundaryComponent).";

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
	portal?: boolean;
}) => {
	const { ownerRef, associatedTargetStyles, portal } = params;
	const warnedAboutMultipleTargetsRef = useRef(false);
	const [targetEntry, setTargetEntry] = useState<BoundaryTargetEntry | null>(
		null,
	);

	const registerTargetRef = useCallback(
		(targetRef: AnimatedRef<View>, preparedStyles: StyleProps) => {
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

				return prev ?? { ref: targetRef, preparedStyles };
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
			entryTag: params.entryTag,
			portal,
		}),
		[
			ownerRef,
			registerTargetRef,
			unregisterTargetRef,
			targetEntry,
			associatedTargetStyles,
			params.entryTag,
			portal,
		],
	);

	return {
		contextValue,
		hasActiveTarget: targetEntry !== null,
		measuredRef: targetEntry?.ref ?? ownerRef,
		targetPreparedStyles: targetEntry?.preparedStyles,
		portal,
	};
};
