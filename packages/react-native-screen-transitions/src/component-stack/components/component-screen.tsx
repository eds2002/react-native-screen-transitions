import type * as React from "react";
import { StyleSheet, type View } from "react-native";
import Animated, {
	useAnimatedProps,
	useAnimatedRef,
} from "react-native-reanimated";
import { LayoutAnchorProvider } from "../../shared/providers/layout-anchor.provider";
import { AnimationStore } from "../../shared/stores/animation.store";

interface ScreenProps {
	routeKey: string;
	children: React.ReactNode;
}
const POINT_NONE = "none" as const;
const POINT_BOX_NONE = "box-none" as const;

export const ComponentScreen = ({ routeKey, children }: ScreenProps) => {
	const sceneClosing = AnimationStore.getAnimation(routeKey, "closing");
	const screenRef = useAnimatedRef<View>();

	const animatedProps = useAnimatedProps(() => {
		return {
			pointerEvents: sceneClosing.get() ? POINT_NONE : POINT_BOX_NONE,
		};
	});

	const ComponentScreenComponent = Animated.View;

	return (
		<ComponentScreenComponent
			ref={screenRef}
			style={StyleSheet.absoluteFill}
			animatedProps={animatedProps}
		>
			<LayoutAnchorProvider anchorRef={screenRef}>
				{children}
			</LayoutAnchorProvider>
		</ComponentScreenComponent>
	);
};
