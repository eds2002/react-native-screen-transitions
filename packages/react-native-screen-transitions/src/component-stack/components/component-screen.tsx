import type * as React from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import { AnimationStore } from "../../shared/stores/animation.store";

interface ScreenProps {
	routeKey: string;
	children: React.ReactNode;
}
const POINT_NONE = "none" as const;
const POINT_BOX_NONE = "box-none" as const;

export const ComponentScreen = ({ routeKey, children }: ScreenProps) => {
	const sceneClosing = AnimationStore.getValue(routeKey, "closing");

	const animatedProps = useAnimatedProps(() => {
		return {
			pointerEvents: sceneClosing.get() ? POINT_NONE : POINT_BOX_NONE,
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
