import type React from "react";
import { type ComponentType, forwardRef, memo, useContext } from "react";
import type { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { useGestureContext } from "@/contexts/gesture";
import { TransitionNestingContext } from "@/contexts/transition-nesting";
import { useBoundsMountMeasurement } from "@/hooks/use-bounds-mount-measurement";
import { useInterpolatorStyles } from "@/hooks/use-interpolator-styles";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import type { Any, TransitionAwareProps } from "@/types";
import { useKey } from "../../hooks/use-key";
import { RootWrapper } from "./transition-root-wrapper";

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
		const screenKey = useKey();
		const nestingMap = useContext(TransitionNestingContext);

		const animatedRef = useAnimatedRef<View>();

		/**
		 * TODO:
		 * We wouldn't want to measure on mount for all components, this is expensive and for an instagram style transition, not worth it. Eventually we'll intercept the onPress (if available), calculate first, then run the onpress. This is how apple handles shared transitions ( if you notice the delay)
		 */
		useBoundsMountMeasurement({
			sharedBoundTag,
			animatedRef,
			screenKey,
		});

		const { styleIdStyle } = useInterpolatorStyles({
			styleId: styleId || sharedBoundTag,
		});

		return (
			<RootWrapper screenKey={screenKey} nestingMap={nestingMap}>
				{isScrollable ? (
					<ScrollableInner {...(props as Any)} ref={ref} />
				) : (
					<AnimatedComponent
						{...rest}
						ref={sharedBoundTag ? animatedRef : ref}
						style={[{ flex: 1 }, style, styleIdStyle]}
					>
						{children}
					</AnimatedComponent>
				)}
			</RootWrapper>
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
