import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, {
	useAnimatedProps,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { useStack } from "../../hooks/navigation/use-stack";
import { useSharedValueState } from "../../hooks/reanimated/use-shared-value-state";
import { useManagedStackContext } from "../../providers/stack/managed.provider";
import { AnimationStore } from "../../stores/animation.store";
import type { BackdropBehavior } from "../../types/screen.types";
import {
	type InactiveBehavior,
	type NativeScreenState,
	resolveNativeScreenPointerEvents,
	resolveNativeScreenState,
	shouldUnmountNativeScreen,
} from "./helpers";
import { ScreenHostProvider } from "./screen-host.provider";

const PASSTHROUGH = "passthrough";

interface ScreenProps {
	routeKey: string;
	index: number;
	isPreloaded: boolean;
	inactiveBehavior?: InactiveBehavior;
	children: ReactNode;
}

export const ScreenHost = ({
	routeKey,
	index,
	isPreloaded,
	inactiveBehavior = "pause",
	children,
}: ScreenProps) => {
	const { routes, optimisticFocusedIndex } = useStack();
	const { backdropBehaviors } = useManagedStackContext();

	const routesLength = routes.length;

	const sceneClosing = AnimationStore.getValue(routeKey, "closing");
	const contentState = useSharedValue<NativeScreenState>("inert");

	const route = routes[index] as
		| ({ state?: unknown } & (typeof routes)[number])
		| undefined;

	const hasNestedState = Boolean(route?.state);
	const nextBackdropBehavior = backdropBehaviors[index + 1] as
		| BackdropBehavior
		| undefined;

	useDerivedValue(() => {
		const nextState = resolveNativeScreenState({
			index,
			routesLength,
			isPreloaded,
			focusedIndex: optimisticFocusedIndex.value,
			isClosing: sceneClosing.get(),
			nextBackdropBehavior,
		});

		if (nextState !== contentState.get()) {
			contentState.set(nextState);
		}
	});

	const state = useSharedValueState(contentState);
	const shouldUnmount = shouldUnmountNativeScreen({
		inactiveBehavior,
		state,
		hasNestedState,
	});

	const isInert = state !== "interactive";
	const shouldPauseEffects =
		state === "inactive" && inactiveBehavior !== "none";
	const activityMode = shouldPauseEffects ? "hidden" : "visible";

	const animatedPointerEvents = useAnimatedProps(() => {
		const isClosing = sceneClosing.get() > 0;
		const activeIndex = optimisticFocusedIndex.value;
		const activeBackdrop = backdropBehaviors[activeIndex] ?? "block";
		const isAllowedPassthroughBelow =
			activeBackdrop === PASSTHROUGH && index === activeIndex - 1;

		return {
			pointerEvents: resolveNativeScreenPointerEvents({
				isClosing,
				isActive: index === activeIndex,
				isAllowedPassthroughBelow,
			}),
		};
	});

	if (shouldUnmount) {
		return null;
	}

	return (
		<Animated.View
			collapsable={false}
			style={StyleSheet.absoluteFill}
			animatedProps={animatedPointerEvents}
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
