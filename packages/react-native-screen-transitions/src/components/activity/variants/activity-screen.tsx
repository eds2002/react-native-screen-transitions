import type * as React from "react";
import { memo, useState } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { useSharedValueState } from "../../../hooks/reanimated/use-shared-value-state";
import { useOptionalMotionStore } from "../../../providers/screen/motion";
import { useBlankStackStore } from "../../../providers/stack/blank-stack.provider";
import type { StackSceneActivity } from "../../../types/stack.types";
import { ActivityView, type ActivityViewMode } from "../activity-view";
import { DEFAULT_INACTIVE_BEHAVIOR, type InactiveBehavior } from "../helpers";

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
	const registeredPaintDriverProgress = useOptionalMotionStore(
		paintDriverRouteKey ?? null,
		(store) => store.state.transitionProgress,
	);
	const [paintDriver, setPaintDriver] = useState({
		key: paintDriverRouteKey,
		progress: registeredPaintDriverProgress,
	});
	// Activity disconnects the driver's provider when it pauses. Keep observing
	// the same progress value so that pausing it doesn't wake older screens.
	if (
		paintDriver.key !== paintDriverRouteKey ||
		(registeredPaintDriverProgress !== null &&
			paintDriver.progress !== registeredPaintDriverProgress)
	) {
		setPaintDriver({
			key: paintDriverRouteKey,
			progress: registeredPaintDriverProgress,
		});
	}
	const paintDriverProgress =
		registeredPaintDriverProgress ??
		(paintDriver.key === paintDriverRouteKey ? paintDriver.progress : null);

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
