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

type ActivityState = 0 | 1 | 2;
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
	const nativeScreenDisabled = useStack((s) => s.flags.DISABLE_NATIVE_SCREENS);
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
	const isPaintDriverSettled = useDerivedValue(() => {
		"worklet";

		if (!paintDriverAnimations) {
			return false;
		}

		return paintDriverAnimations.progress.get() >= 1;
	});

	const isPaintDriverSettledOnJS = useSharedValueState(isPaintDriverSettled);

	let activityState: ActivityState = ActivityStateByActivity[activity];
	let shouldFreeze = false;
	let visible = activity !== "inactive";

	const shouldWaitForPaintDriver = !isPaintDriverSettledOnJS;

	if (activity === "inactive") {
		if (inactiveBehavior === "keep") {
			activityState = 1;
			visible = true;
		} else if (shouldWaitForPaintDriver) {
			// Delay hiding until the paint driver has settled to avoid
			// a blank frame during the transition.
			activityState = 1;
			visible = true;
		} else if (inactiveBehavior === "pause") {
			activityState = 1;
			shouldFreeze = true;
			visible = true;
		} else {
			// `hide` freezes and hides native presentation. Non-nested
			// `unmount` removes the React subtree through the JS guard below.
			activityState = 0;
			shouldFreeze = true;
			visible = false;
		}
	}

	const shouldUnmount =
		inactiveBehavior === "unmount" &&
		activity === "inactive" &&
		!hasNestedState &&
		isPaintDriverSettledOnJS;

	const pointerEvents = PointerEventsByActivity[activity];

	if (shouldUnmount) {
		return null;
	}

	const style = [StyleSheet.absoluteFill, visible ? undefined : styles.hidden];

	if (IS_WEB || nativeScreenDisabled) {
		return (
			<View style={style} pointerEvents={pointerEvents} collapsable={false}>
				{children}
			</View>
		);
	}

	return (
		<Screen
			style={style}
			activityState={activityState}
			shouldFreeze={shouldFreeze}
			pointerEvents={pointerEvents}
			collapsable={false}
		>
			{children}
		</Screen>
	);
});

const HIDDEN_SCREEN_OFFSET = 10_000;
const styles = StyleSheet.create({
	hidden: {
		// NOTE:
		// When setting a screen to display:"none", the gesture detector will not recognize anymore. Since I believe
		// rngh is attaching itself to its nearest native view, this of course would kill the detector.
		// To avoid this, we use a transform to move the screen off-screen instead of display: "none". This isn't my favorite approach,
		// but i'm hoping react 19's activity could mitigate this better and avoid dependence on rns.
		transform: [{ translateY: HIDDEN_SCREEN_OFFSET }],
	},
});
