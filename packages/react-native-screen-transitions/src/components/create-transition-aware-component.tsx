import type React from "react";
import { type ComponentType, forwardRef, memo } from "react";
import type { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { useInterpolatorStyles } from "@/hooks/animation/use-interpolator-styles";
import { useBoundsMeasurement } from "@/hooks/bounds/use-bounds-measurement";
import { useScrollProgress } from "@/hooks/gestures/use-scroll-progress";
import { useGestureContext } from "@/navigator/contexts/gesture";
import { useScreenKeys } from "@/navigator/contexts/screen-keys";
import type { Any, TransitionAwareProps } from "@/types";

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
		const { children, style, sharedBoundTag, styleId, ...rest } = props as Any;
		const { currentScreenKey } = useScreenKeys();

		const animatedRef = useAnimatedRef<View>();

		/**
		 * TODO:
		 * We wouldn't want to measure on mount for all components, this is expensive and for an instagram style transition, not worth it. Eventually we'll intercept the onPress (if available), calculate first, then run the onpress. This is how apple handles shared transitions ( if you notice the delay)
		 */
		useBoundsMeasurement({
			sharedBoundTag,
			animatedRef,
			screenKey: currentScreenKey,
		});

		const { styleIdStyle } = useInterpolatorStyles({
			styleId: styleId || sharedBoundTag,
		});

		if (isScrollable) {
			return <ScrollableInner {...(props as Any)} ref={ref} />;
		}

		return (
			<AnimatedComponent
				{...rest}
				ref={sharedBoundTag ? animatedRef : ref}
				style={[{ flex: 1 }, style, styleIdStyle]}
			>
				{children}
			</AnimatedComponent>
		);
	});

	Inner.displayName = `Transition(${Wrapped.displayName || Wrapped.name || "Component"})`;

	return memo(Inner) as React.MemoExoticComponent<
		React.ForwardRefExoticComponent<
			TransitionAwareProps<P> &
				React.RefAttributes<React.ComponentRef<typeof Wrapped>>
		>
	>;
}
