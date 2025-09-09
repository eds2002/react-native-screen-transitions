import type React from "react";
import { type ComponentType, forwardRef, memo } from "react";
import type { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnUI, useAnimatedRef } from "react-native-reanimated";
import { useAssociatedStyles } from "../hooks/animation/use-associated-style";
import { useBoundsRegistry } from "../hooks/bounds/use-bound-registry";
import { useScrollRegistry } from "../hooks/gestures/use-scroll-registry";
import { useGestureContext } from "../providers/gestures";
import { useKeys } from "../providers/keys";
import type { TransitionAwareProps } from "../types/core";
import type { Any } from "../types/utils";

interface CreateTransitionAwareComponentOptions {
	isScrollable?: boolean;
}

export function createTransitionAwareComponent<P extends object>(
	Wrapped: ComponentType<P>,
	options: CreateTransitionAwareComponentOptions = {},
) {
	const { isScrollable = false } = options;

	const AnimatedComponent = Animated.createAnimatedComponent(Wrapped);

	const ScrollableInner = forwardRef<
		React.ComponentRef<typeof Wrapped>,
		TransitionAwareProps<P>
	>((props: Any, ref) => {
		const { nativeGesture } = useGestureContext();
		const { scrollHandler, onContentSizeChange, onLayout } = useScrollRegistry({
			onScroll: props.onScroll,
			onContentSizeChange: props.onContentSizeChange,
			onLayout: props.onLayout,
		});

		return (
			<GestureDetector gesture={nativeGesture}>
				<AnimatedComponent
					{...(props as Any)}
					ref={ref}
					onScroll={scrollHandler}
					onContentSizeChange={onContentSizeChange}
					onLayout={onLayout}
					scrollEventThrottle={props.scrollEventThrottle || 16}
				/>
			</GestureDetector>
		);
	});

	const Inner = forwardRef<
		React.ComponentRef<typeof AnimatedComponent>,
		TransitionAwareProps<P>
	>((props, _) => {
		const { children, style, sharedBoundTag, styleId, onPress, ...rest } =
			props as Any;

		const animatedRef = useAnimatedRef<View>();

		const { associatedStyles } = useAssociatedStyles({
			id: sharedBoundTag || styleId,
			style,
		});

		const {
			handleTransitionLayout,
			captureActiveOnPress,
			MeasurementSyncProvider,
		} = useBoundsRegistry({
			sharedBoundTag,
			animatedRef,
			style,
			onPress,
		});

		return (
			<MeasurementSyncProvider>
				<AnimatedComponent
					{...(rest as Any)}
					ref={animatedRef}
					style={[style, associatedStyles]}
					onPress={captureActiveOnPress}
					onLayout={runOnUI(handleTransitionLayout)}
					collapsable={!sharedBoundTag}
				>
					{children}
				</AnimatedComponent>
			</MeasurementSyncProvider>
		);
	});

	if (isScrollable) {
		return memo(ScrollableInner) as React.MemoExoticComponent<
			React.ForwardRefExoticComponent<
				TransitionAwareProps<P> &
					React.RefAttributes<React.ComponentRef<typeof Wrapped>>
			>
		>;
	}

	return memo(Inner) as React.MemoExoticComponent<
		React.ForwardRefExoticComponent<
			TransitionAwareProps<P> &
				React.RefAttributes<React.ComponentRef<typeof Wrapped>>
		>
	>;
}
