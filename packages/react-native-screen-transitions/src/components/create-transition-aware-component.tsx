import type React from "react";
import { type ComponentType, forwardRef, memo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  type AnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";
import { TransitionGestureHandlerProvider } from "@/components/transition-gesture-handler-provider";
import { _useScreenAnimation } from "../hooks/use-screen-animation";
import { useSkipFirstFrame } from "../hooks/use-skip-first-frame";
import type { Any } from "../types";

export function createTransitionAwareComponent<P extends object>(
	Wrapped: ComponentType<P>,
) {
	const AnimatedComponent = Animated.createAnimatedComponent(Wrapped);

	type Props = AnimatedProps<P>;

	const Inner = forwardRef<React.ComponentRef<typeof AnimatedComponent>, Props>(
		(props, ref) => {
			const { children, style, ...rest } = props as Any;

			const { screenStyleInterpolator, ...screenInterpolationProps } =
				_useScreenAnimation();

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
				<TransitionGestureHandlerProvider>
					<Animated.View style={[{ flex: 1 }, flickerFixStyle]}>
						<Animated.View
							style={[StyleSheet.absoluteFillObject, overlayStyle]}
							pointerEvents="none"
						/>
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
					</Animated.View>
				</TransitionGestureHandlerProvider>
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
