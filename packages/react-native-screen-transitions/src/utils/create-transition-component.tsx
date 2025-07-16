import type React from "react";
import { type ComponentType, forwardRef, memo } from "react";
import { StyleSheet } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
	type AnimatedProps,
	useAnimatedStyle,
} from "react-native-reanimated";
import { _useScreenAnimation } from "../hooks/use-screen-animation";
import { useSkipFirstFrame } from "../hooks/use-skip-first-frame";
import type { Any } from "../types";

export function createTransitionComponent<P extends object>(
	Wrapped: ComponentType<P>,
) {
	const AnimatedComponent = Animated.createAnimatedComponent(Wrapped);

	type Props = AnimatedProps<P>;

	const Inner = forwardRef<React.ComponentRef<typeof AnimatedComponent>, Props>(
		(props, ref) => {
			const { children, style, ...rest } = props as Any;

			const {
				screenStyleInterpolator,
				gestureDetector,
				...screenInterpolationProps
			} = _useScreenAnimation();

			const screenContainerStyle = useAnimatedStyle(() => {
				"worklet";
				return (
					screenStyleInterpolator(screenInterpolationProps).contentStyle || {}
				);
			});
			const overlayStyle = useAnimatedStyle(() => {
				"worklet";
				return (
					screenStyleInterpolator(screenInterpolationProps).overlayStyle || {}
				);
			});

			const { style: flickerFixStyle } = useSkipFirstFrame();

			return (
				<Animated.View style={[{ flex: 1 }, flickerFixStyle]}>
					<GestureDetector gesture={gestureDetector}>
						<AnimatedComponent
							{...rest}
							ref={ref}
							style={[
								{ flex: 1, position: "relative" },
								screenContainerStyle,
								style,
							]}
						>
							{children}
						</AnimatedComponent>
					</GestureDetector>
					<Animated.View
						style={[
							StyleSheet.absoluteFillObject,
							overlayStyle,
							{ zIndex: 10000 },
						]}
						pointerEvents="none"
					/>
				</Animated.View>
			);
		},
	);

	Inner.displayName = `Transition(${Wrapped.displayName || Wrapped.name || "Component"})`;

	return memo(Inner) as React.MemoExoticComponent<
		React.ForwardRefExoticComponent<
			AnimatedProps<P> & React.RefAttributes<React.ComponentRef<typeof Wrapped>>
		>
	>;
}
