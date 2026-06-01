import type * as React from "react";
import { memo } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { useSharedValueState } from "../../../hooks/reanimated/use-shared-value-state";
import { AnimationStore } from "../../../stores/animation.store";
import type { StackSceneActivity } from "../../../types/stack.types";
import type { InactiveBehavior } from "../helpers";
import { Activity, type ActivityMode } from "./activity";

type ActivityPointerEvents = NonNullable<ViewProps["pointerEvents"]>;

const PointerEventsByActivity = {
	active: "auto",
	inert: "auto",
	inactive: "none",
	closing: "none",
} satisfies Record<StackSceneActivity, ActivityPointerEvents>;

interface ActivityScreenProps {
	activity: StackSceneActivity;
	children: React.ReactNode;
	hasNestedState?: boolean;
	inactiveBehavior?: InactiveBehavior;
	paintDriverRouteKey?: string;
}

export const ActivityScreen = memo(function ActivityScreen({
	activity,
	children,
	hasNestedState = false,
	inactiveBehavior = "none",
	paintDriverRouteKey,
}: ActivityScreenProps) {
	const paintDriverAnimations = paintDriverRouteKey
		? AnimationStore.getBag(paintDriverRouteKey)
		: undefined;

	/**
	 * Avoid hiding inactive content until the screen that exposes it has settled.
	 *
	 * For A(inactive), B(inert), C(active), A's paint depends on C finishing its
	 * transition. Watching B can still leave a brief blank frame, so we wait for
	 * C's progress to reach its settled value of 1 before hiding or unmounting A.
	 */
	const isPaintDriverSettled = useSharedValueState(
		useDerivedValue(() => {
			"worklet";

			if (!paintDriverAnimations) {
				return false;
			}

			return paintDriverAnimations.progress.get() >= 1;
		}),
	);

	const shouldWaitForPaintDriver = !isPaintDriverSettled;
	const shouldUnmount =
		inactiveBehavior === "unmount" &&
		activity === "inactive" &&
		!hasNestedState &&
		isPaintDriverSettled;

	if (shouldUnmount) {
		return null;
	}

	let mode: ActivityMode = "visible";
	let visible = true;

	if (activity === "inactive") {
		if (inactiveBehavior === "none") {
			mode = "visible";
		} else if (shouldWaitForPaintDriver) {
			mode = "visible";
		} else if (inactiveBehavior === "pause") {
			mode = "hidden";
		} else {
			mode = "hidden";
			visible = false;
		}
	}

	const pointerEvents = PointerEventsByActivity[activity];

	return (
		<View
			collapsable={false}
			style={StyleSheet.absoluteFill}
			pointerEvents={pointerEvents}
		>
			<Activity mode={mode} visible={visible}>
				{children}
			</Activity>
		</View>
	);
});
