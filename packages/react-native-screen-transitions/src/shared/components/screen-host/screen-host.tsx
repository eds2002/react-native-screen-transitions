import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import { useStack } from "../../hooks/navigation/use-stack";
import { useManagedStackContext } from "../../providers/stack/managed.provider";
import { AnimationStore } from "../../stores/animation.store";
import {
	PASSTHROUGH,
	POINTER_EVENTS_BOX_NONE,
	POINTER_EVENTS_NONE,
} from "./constants";
import { useScreenActivityState } from "./hooks/use-screen-activity-state";
import { ScreenHostProvider } from "./screen-host.provider";

interface ScreenProps {
	routeKey: string;
	index: number;
	isPreloaded: boolean;
	inactiveBehavior?: "pause" | "unmount" | "none";
	children: ReactNode;
}

export const ScreenHost = ({
	routeKey,
	index,
	isPreloaded,
	inactiveBehavior = "pause",
	children,
}: ScreenProps) => {
	const { routes, routeKeys, optimisticFocusedIndex } = useStack();
	const { backdropBehaviors } = useManagedStackContext();

	const sceneClosing = AnimationStore.getValue(routeKey, "closing");

	const route = routes[index];

	const hasNestedState = "state" in route;

	const state = useScreenActivityState({
		routeKey,
		routeKeys,
		index,
		isPreloaded,
	});

	const shouldUnmount =
		inactiveBehavior === "unmount" && state === "inactive" && !hasNestedState;
	const isInert = state !== "interactive";
	const shouldPauseEffects =
		state === "inactive" && inactiveBehavior !== "none";

	const activityMode = shouldPauseEffects ? "hidden" : "visible";

	const containerProps = useAnimatedProps(() => {
		const isClosing = sceneClosing.get();
		const activeIndex = optimisticFocusedIndex.get();
		const activeBackdrop = backdropBehaviors[activeIndex] ?? "block";
		const isAllowedPassthroughBelow =
			activeBackdrop === PASSTHROUGH && index === activeIndex - 1;
		const isActive = index === activeIndex;

		return {
			pointerEvents:
				isClosing || (!isActive && !isAllowedPassthroughBelow)
					? POINTER_EVENTS_NONE
					: POINTER_EVENTS_BOX_NONE,
		};
	});

	if (shouldUnmount) {
		return null;
	}

	return (
		<Animated.View
			collapsable={false}
			style={StyleSheet.absoluteFill}
			animatedProps={containerProps}
		>
			<ScreenHostProvider
				activityMode={activityMode}
				isInert={isInert}
				contentStyle={styles.content}
			>
				{children}
			</ScreenHostProvider>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
});
