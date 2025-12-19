import type * as React from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import { AnimationStore } from "../../shared/stores/animation.store";

interface ScreenProps {
	routeKey: string;
	children: React.ReactNode;
}

export const ComponentScreen = ({ routeKey, children }: ScreenProps) => {
	const sceneClosing = AnimationStore.getAnimation(routeKey, "closing");

	const animatedProps = useAnimatedProps(() => {
		return {
			pointerEvents: sceneClosing.get()
				? ("none" as const)
				: ("box-none" as const),
		};
	});

	const ComponentScreenComponent = Animated.View;

	return (
		<ComponentScreenComponent
			style={StyleSheet.absoluteFill}
			animatedProps={animatedProps}
		>
			{children}
		</ComponentScreenComponent>
	);
};
