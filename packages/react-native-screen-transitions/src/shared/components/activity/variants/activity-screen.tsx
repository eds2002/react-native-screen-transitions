import type * as React from "react";
import { memo } from "react";
import { StyleSheet, type ViewProps } from "react-native";
import Animated, {
	useAnimatedProps,
	useAnimatedStyle,
	useDerivedValue,
} from "react-native-reanimated";
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

const AnimatedScreen = Animated.createAnimatedComponent(Screen);

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

	const resolvedActivity = useDerivedValue(() => {
		let activityState: ActivityState = ActivityStateByActivity[activity];
		let shouldFreeze = false;
		let visible = activity !== "inactive";

		const shouldWaitForPaintDriver = !isPaintDriverSettled.get();

		if (activity === "inactive") {
			if (inactiveBehavior === "keep") {
				activityState = 1;
				visible = true;
			} else if (shouldWaitForPaintDriver) {
				activityState = 1;
				visible = true;
			} else if (inactiveBehavior === "freeze") {
				activityState = 1;
				shouldFreeze = true;
				visible = true;
			} else {
				activityState = 0;
				visible = false;
			}
		}

		return { activityState, shouldFreeze, visible };
	});

	const animatedProps = useAnimatedProps(() => {
		return {
			activityState: resolvedActivity.get().activityState,
			shouldFreeze: resolvedActivity.get().shouldFreeze,
		};
	});
	const animatedStyle = useAnimatedStyle(() => {
		return {
			display: resolvedActivity.get().visible ? "flex" : "none",
		};
	});

	const shouldUnmount =
		inactiveBehavior === "unmount" &&
		activity === "inactive" &&
		!hasNestedState &&
		isPaintDriverSettledOnJS;

	const pointerEvents = PointerEventsByActivity[activity];
	const Component =
		IS_WEB || nativeScreenDisabled ? Animated.View : AnimatedScreen;

	if (shouldUnmount) {
		return null;
	}

	return (
		<Component
			style={[StyleSheet.absoluteFill, animatedStyle]}
			animatedProps={animatedProps}
			pointerEvents={pointerEvents}
			collapsable={false}
		>
			{children}
		</Component>
	);
});
