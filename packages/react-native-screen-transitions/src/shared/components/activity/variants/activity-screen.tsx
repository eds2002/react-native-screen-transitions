import type * as React from "react";
import { memo } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { Screen } from "react-native-screens";
import { IS_WEB } from "../../../constants";
import { useStack } from "../../../hooks/navigation/use-stack";
import { useSharedValueState } from "../../../hooks/reanimated/use-shared-value-state";
import { AnimationStore } from "../../../stores/animation.store";
import type { StackSceneActivity } from "../../../types/stack.types";
import { DEFAULT_INACTIVE_BEHAVIOR, type InactiveBehavior } from "../helpers";
import type { ActivityState } from "./activity";

const ActivityStateByActivity = {
	active: 2,
	inert: 1,
	inactive: 0,
	closing: 1,
} satisfies Record<StackSceneActivity, ActivityState>;

const PointerEventsByActivity = {
	active: "auto",
	inert: "auto",
	inactive: "none",
	closing: "none",
} satisfies Record<StackSceneActivity, ViewProps["pointerEvents"]>;

interface ActivityScreenProps {
	activity: StackSceneActivity;
	children: React.ReactNode;
	inactiveBehavior?: InactiveBehavior;
	paintDriverRouteKey?: string;
	hasNestedState?: boolean;
}

export const ActivityScreen = memo(function ActivityScreen({
	activity,
	children,
	inactiveBehavior = DEFAULT_INACTIVE_BEHAVIOR,
	paintDriverRouteKey,
	hasNestedState,
}: ActivityScreenProps) {
	const paintDriverAnimations = paintDriverRouteKey
		? AnimationStore.getBag(paintDriverRouteKey)
		: undefined;

	/**
	 * Avoid hiding inactive content until the screen that exposes it has settled.
	 *
	 * For A(inactive), B(inert), C(active), A's paint depends on C finishing its
	 * transition. Watching B can still leave a brief blank frame, so we wait for
	 * C's progress to reach its settled value of 1 before hiding A.
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

	const shouldUnmount =
		inactiveBehavior === "unmount" &&
		activity === "inactive" &&
		!hasNestedState &&
		isPaintDriverSettled;

	const shouldWaitForPaintDriver = !isPaintDriverSettled;

	let activityState: ActivityState = ActivityStateByActivity[activity];
	let shouldFreeze = false;
	let visible = activity !== "inactive";

	if (activity === "inactive") {
		switch (inactiveBehavior) {
			case "keep": {
				activityState = 1;
				visible = true;
				break;
			}
			case "freeze": {
				activityState = 1;
				shouldFreeze = true;
				visible = true;
				break;
			}
			default: {
				if (shouldWaitForPaintDriver) {
					// Delay hiding until the paint driver has settled to avoid
					// a blank frame during the transition.
					activityState = 1;
					visible = true;
				} else {
					// Native screens stay in the React tree. `unmount` is web-only later,
					// and aliases to detach for react-native-screens.
					activityState = 0;
					visible = false;
				}
				break;
			}
		}
	}

	const pointerEvents = PointerEventsByActivity[activity];

	const nativeScreenDisabled = useStack((s) => s.flags.DISABLE_NATIVE_SCREENS);
	const Component = IS_WEB || nativeScreenDisabled ? View : Screen;

	if (shouldUnmount) {
		return null;
	}

	return (
		<Component
			style={[StyleSheet.absoluteFill, !visible && styles.hidden]}
			activityState={activityState}
			shouldFreeze={shouldFreeze}
			pointerEvents={pointerEvents}
			collapsable={false}
		>
			{children}
		</Component>
	);
});

const styles = StyleSheet.create({
	hidden: {
		display: "none",
	},
});
