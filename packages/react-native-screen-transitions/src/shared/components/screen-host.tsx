import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import { useStack } from "../hooks/navigation/use-stack";
import { useManagedStackContext } from "../providers/stack/managed.provider";
import { AnimationStore } from "../stores/animation.store";

const PASSTHROUGH = "passthrough";
const POINT_NONE = "none" as const;
const POINT_BOX_NONE = "box-none" as const;

interface ScreenHostProps {
	routeKey: string;
	index: number;
	children: ReactNode;
}

export const ScreenHost = ({ routeKey, index, children }: ScreenHostProps) => {
	const { optimisticFocusedIndex } = useStack();
	const { backdropBehaviors } = useManagedStackContext();
	const sceneClosing = AnimationStore.getValue(routeKey, "closing");

	const animatedProps = useAnimatedProps(() => {
		const isClosing = sceneClosing.get() > 0;
		const activeIndex = optimisticFocusedIndex.get();
		const isActive = index === activeIndex;

		const activeBackdrop = backdropBehaviors[activeIndex] ?? "block";
		const activeAllowsPassthrough = activeBackdrop === PASSTHROUGH;
		const isAllowedPassthroughBelow =
			activeAllowsPassthrough && index === activeIndex - 1;

		const pointerEvents =
			isClosing || (!isActive && !isAllowedPassthroughBelow)
				? POINT_NONE
				: POINT_BOX_NONE;

		return { pointerEvents };
	});

	return (
		<Animated.View
			// Keep a native boundary per screen so Android release builds do not
			// flatten sibling screens together.
			collapsable={false}
			style={StyleSheet.absoluteFill}
			animatedProps={animatedProps}
		>
			{children}
		</Animated.View>
	);
};
