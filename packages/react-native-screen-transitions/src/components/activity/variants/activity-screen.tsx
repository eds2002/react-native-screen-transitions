import type * as React from "react";
import { memo } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { useSharedValueState } from "../../../hooks/reanimated/use-shared-value-state";
import { useOptionalMotionStore } from "../../../providers/screen/motion";
import { useBlankStackStore } from "../../../providers/stack/blank-stack.provider";
import type { StackSceneActivity } from "../../../types/stack.types";
import { ActivityView, type ActivityViewMode } from "../activity-view";
import { DEFAULT_INACTIVE_BEHAVIOR, type InactiveBehavior } from "../helpers";

const PointerEventsByActivity = {
	active: "auto",
	inert: "auto",
	inactive: "none",
	closing: "none",
} satisfies Record<StackSceneActivity, ViewProps["pointerEvents"]>;

interface ActivityScreenProps {
	children: React.ReactNode;
	inactiveBehavior?: InactiveBehavior;
	paintDriverRouteKey?: string;
	hasNestedState?: boolean;
	routeKey: string;
}

export const ActivityScreen = memo(function ActivityScreen({
	children,
	inactiveBehavior,
	paintDriverRouteKey,
	hasNestedState,
	routeKey,
}: ActivityScreenProps) {
	const scene = useBlankStackStore((store) => store.scenesByKey[routeKey]);
	const stackPaintDriverRouteKey = useBlankStackStore((store) =>
		store.paintDriverRouteKeyByRouteKey.get(routeKey),
	);
	const stackInactiveBehavior = (
		scene.descriptor.options as { inactiveBehavior?: InactiveBehavior }
	).inactiveBehavior;
	const resolvedInactiveBehavior =
		inactiveBehavior ?? stackInactiveBehavior ?? DEFAULT_INACTIVE_BEHAVIOR;
	const resolvedPaintDriverRouteKey =
		paintDriverRouteKey ?? stackPaintDriverRouteKey;
	const resolvedHasNestedState = hasNestedState ?? "state" in scene.route;
	const paintDriverAnimations = useOptionalMotionStore(
		resolvedPaintDriverRouteKey ?? null,
		(store) => store.state,
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

		if (!paintDriverAnimations) {
			return false;
		}

		return paintDriverAnimations.transitionProgress.get() >= 1;
	});

	const isPaintDriverSettledOnJS = useSharedValueState(isPaintDriverSettled);

	let activityViewMode: ActivityViewMode =
		scene.activity === "active" ? "normal" : "inert";
	let visible = scene.activity !== "inactive";

	if (scene.activity === "inactive") {
		if (resolvedInactiveBehavior === "keep" || !isPaintDriverSettledOnJS) {
			visible = true;
		} else if (resolvedInactiveBehavior === "pause") {
			activityViewMode = "paused";
			visible = true;
		} else {
			activityViewMode = "paused";
			visible = false;
		}
	}

	const shouldUnmount =
		resolvedInactiveBehavior === "unmount" &&
		scene.activity === "inactive" &&
		!resolvedHasNestedState &&
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
