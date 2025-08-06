import type React from "react";
import { type ComponentType, forwardRef, memo } from "react";
import type { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnUI, useAnimatedRef } from "react-native-reanimated";
import { useAssociatedStyles } from "../hooks/animation/use-associated-style";
import { useBoundMeasurer } from "../hooks/bounds/use-bound-measurer";
import { useScrollProgress } from "../hooks/gestures/use-scroll-progress";
import { useGestureContext } from "../navigator/context/gestures";
import { useKeys } from "../navigator/context/keys";
import type { TransitionAwareProps } from "../types/core";
import type { Any } from "../types/utils";
import { BoundActivator } from "./bounds-activator";

interface CreateTransitionAwareComponentOptions {
	isScrollable?: boolean;
	enableTapActivate?: boolean; // default true
}

export function createTransitionAwareComponent<P extends object>(
	Wrapped: ComponentType<P>,
	options: CreateTransitionAwareComponentOptions = {},
) {
	const { isScrollable = false, enableTapActivate = true } = options;

	const AnimatedComponent = Animated.createAnimatedComponent(Wrapped);

	const ScrollableInner = forwardRef<
		React.ComponentRef<typeof Wrapped>,
		TransitionAwareProps<P>
	>((props: Any, ref) => {
		const { nativeGesture } = useGestureContext();

		const { scrollHandler, onContentSizeChange } = useScrollProgress({
			onScroll: props.onScroll,
			onContentSizeChange: props.onContentSizeChange,
		});

		return (
			<GestureDetector gesture={nativeGesture}>
				<AnimatedComponent
					{...(props as Any)}
					ref={ref}
					onScroll={scrollHandler}
					onContentSizeChange={onContentSizeChange}
					scrollEventThrottle={props.scrollEventThrottle || 16}
				/>
			</GestureDetector>
		);
	});

	const Inner = forwardRef<
		React.ComponentRef<typeof AnimatedComponent>,
		TransitionAwareProps<P>
	>((props, ref) => {
		const { children, style, sharedBoundTag, styleId, onPress, ...rest } =
			props as Any;

		const animatedRef = useAnimatedRef<View>();
		const { current } = useKeys();

		const { associatedStyles } = useAssociatedStyles({
			id: sharedBoundTag || styleId,
		});

		const { measureAndSet, measureOnLayout } = useBoundMeasurer({
			sharedBoundTag,
			animatedRef,
			current,
			style,
		});

		if (isScrollable) {
			return <ScrollableInner {...(props as Any)} ref={ref} />;
		}

		return (
			<BoundActivator
				sharedBoundTag={sharedBoundTag}
				enableTap={enableTapActivate}
				measure={measureAndSet}
			>
				<AnimatedComponent
					{...(rest as Any)}
					ref={animatedRef}
					style={[style, associatedStyles]}
					onPress={onPress}
					onLayout={runOnUI(measureOnLayout)}
				>
					{children}
				</AnimatedComponent>
			</BoundActivator>
		);
	});

	return memo(Inner) as React.MemoExoticComponent<
		React.ForwardRefExoticComponent<
			TransitionAwareProps<P> &
				React.RefAttributes<React.ComponentRef<typeof Wrapped>>
		>
	>;
}
