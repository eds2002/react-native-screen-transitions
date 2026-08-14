import type * as React from "react";
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { Screen } from "react-native-screens";
import { IS_WEB } from "../../../constants";
import { useStack } from "../../../hooks/navigation/use-stack";
import { useSharedValueState } from "../../../hooks/reanimated/use-shared-value-state";
import { useBlankStackStore } from "../../../providers/stack/blank-stack.provider";
import { AnimationStore } from "../../../stores/animation.store";
import {
	DEFAULT_INACTIVE_BEHAVIOR,
	HIDDEN_ACTIVITY_SCREEN_STYLE,
	type InactiveBehavior,
	resolveActivityScreenPresentation,
} from "../helpers";

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
	const activity = useBlankStackStore(
		(store) =>
			(store.scenesByKey[routeKey] as (typeof store.scenes)[number]).activity,
	);
	const stackInactiveBehavior = useBlankStackStore(
		(store) =>
			(
				store.scenesByKey[routeKey]?.descriptor.options as
					| { inactiveBehavior?: InactiveBehavior }
					| undefined
			)?.inactiveBehavior,
	);
	const stackRoute = useBlankStackStore(
		(store) => store.scenesByKey[routeKey]?.route,
	);
	const stackPaintDriverRouteKey = useBlankStackStore((store) => {
		const routeIndex = store.routeKeys.indexOf(routeKey);
		return store.routeKeys[routeIndex + 2];
	});
	const resolvedInactiveBehavior =
		inactiveBehavior ?? stackInactiveBehavior ?? DEFAULT_INACTIVE_BEHAVIOR;
	const resolvedPaintDriverRouteKey =
		paintDriverRouteKey ?? stackPaintDriverRouteKey;
	const resolvedHasNestedState =
		hasNestedState ?? (stackRoute ? "state" in stackRoute : false);
	const nativeScreenDisabled = useStack((s) => s.flags.DISABLE_NATIVE_SCREENS);
	const paintDriverAnimations = resolvedPaintDriverRouteKey
		? AnimationStore.getBag(resolvedPaintDriverRouteKey)
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

		return paintDriverAnimations.transitionProgress.get() >= 1;
	});

	const isPaintDriverSettledOnJS = useSharedValueState(isPaintDriverSettled);

	const { visible, ...screenPresentation } = resolveActivityScreenPresentation({
		activity,
		inactiveBehavior: resolvedInactiveBehavior,
		waitForPaintDriver: !isPaintDriverSettledOnJS,
	});

	const shouldUnmount =
		resolvedInactiveBehavior === "unmount" &&
		activity === "inactive" &&
		!resolvedHasNestedState &&
		isPaintDriverSettledOnJS;

	if (shouldUnmount) {
		return null;
	}

	const style = [StyleSheet.absoluteFill, visible ? undefined : styles.hidden];

	if (IS_WEB || nativeScreenDisabled) {
		return (
			<View
				style={style}
				pointerEvents={screenPresentation.pointerEvents}
				collapsable={false}
			>
				{children}
			</View>
		);
	}

	return (
		<Screen {...screenPresentation} style={style} collapsable={false}>
			{children}
		</Screen>
	);
});

const styles = StyleSheet.create({
	hidden: HIDDEN_ACTIVITY_SCREEN_STYLE,
});
