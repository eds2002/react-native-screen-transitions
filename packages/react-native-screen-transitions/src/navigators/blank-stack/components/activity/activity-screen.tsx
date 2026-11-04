import type * as React from "react";
import { memo } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import {
	ActivityView,
	type ActivityViewMode,
} from "../../../../components/activity/activity-view";
import { IS_WEB } from "../../../../constants";
import { useSharedValueState } from "../../../../hooks/reanimated/use-shared-value-state";
import { useOptionalMotionStore } from "../../../../providers/motion";
import type { InactiveBehavior } from "../../../../types/screen.types";
import type { StackSceneActivity } from "../../../../types/stack.types";
import { useBlankStackStore } from "../../state/blank-stack.provider";

const DEFAULT_INACTIVE_BEHAVIOR: InactiveBehavior = IS_WEB ? "unmount" : "hide";

// Let the content and backdrop layers decide whether to capture touches.
const PointerEventsByActivity = {
	active: "box-none",
	inert: "box-none",
	inactive: "none",
	closing: "none",
} satisfies Record<StackSceneActivity, ViewProps["pointerEvents"]>;

interface ActivityScreenProps {
	children: React.ReactNode;
	routeKey: string;
}

export const ActivityScreen = memo(function ActivityScreen({
	children,
	routeKey,
}: ActivityScreenProps) {
	const scene = useBlankStackStore((store) => store.scenesByKey[routeKey]);
	const paintDriverRouteKey = useBlankStackStore((store) =>
		store.paintDriverRouteKeyByRouteKey.get(routeKey),
	);

	const inactiveBehavior =
		(scene.descriptor.options as { inactiveBehavior?: InactiveBehavior })
			.inactiveBehavior ?? DEFAULT_INACTIVE_BEHAVIOR;

	const hasNestedState = "state" in scene.route;

	const paintDriverProgress = useOptionalMotionStore(
		paintDriverRouteKey ?? null,
		(store) => store.state.transitionProgress,
	);

	/**
	 * Avoid hiding inactive content until the screen that exposes it has settled.
	 *
	 * For A(inactive), B(inert), C(active), A's paint depends on C finishing its
	 * transition. Watching B can still leave a brief blank frame, so we wait for
	 * C's progress to reach its settled value of 1 before hiding A.
	 */
	const isPaintDriverSettled = useDerivedValue(() => {
		"worklet";

		if (!paintDriverProgress) {
			return false;
		}

		return paintDriverProgress.get() >= 1;
	});

	const isPaintDriverSettledOnJS = useSharedValueState(isPaintDriverSettled);

	let activityViewMode: ActivityViewMode =
		scene.activity === "active" ? "normal" : "inert";
	let visible = scene.activity !== "inactive";

	if (scene.activity === "inactive") {
		if (inactiveBehavior === "keep" || !isPaintDriverSettledOnJS) {
			visible = true;
		} else if (inactiveBehavior === "pause") {
			activityViewMode = "paused";
			visible = true;
		} else {
			activityViewMode = "paused";
			visible = false;
		}
	}

	const shouldUnmount =
		inactiveBehavior === "unmount" &&
		scene.activity === "inactive" &&
		!hasNestedState &&
		isPaintDriverSettledOnJS;

	if (shouldUnmount) {
		return null;
	}

	return (
		<View
			style={StyleSheet.absoluteFill}
			pointerEvents={PointerEventsByActivity[scene.activity]}
			collapsable={false}
		>
			<ActivityView mode={activityViewMode} visible={visible}>
				{children}
			</ActivityView>
		</View>
	);
});
