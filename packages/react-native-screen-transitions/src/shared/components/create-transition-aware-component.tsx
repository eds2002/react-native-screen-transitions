/** biome-ignore-all lint/style/noNonNullAssertion: <This helper is usually being used inside a transitionable stack> */
import type React from "react";
import { type ComponentType, forwardRef, memo, useCallback } from "react";
import type { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
	runOnUI,
	useAnimatedRef,
	useComposedEventHandler,
	useSharedValue,
} from "react-native-reanimated";
import { useAssociatedStyles } from "../hooks/animation/use-associated-style";
import { useScrollRegistry } from "../hooks/gestures/use-scroll-registry";
import { RegisterBoundsProvider } from "../providers/register-bounds.provider";
import { ScrollSettleProvider } from "../providers/scroll-settle.provider";
import type { TransitionAwareProps } from "../types/screen.types";

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
	>((props: any, ref) => {
		const {
			remeasureOnFocus: _remeasureOnFocus,
			onScroll: userOnScroll,
			onMomentumScrollEnd: userOnMomentumScrollEnd,
			onScrollEndDrag: userOnScrollEndDrag,
			...scrollableProps
		} = props;

		const settledSignal = useSharedValue(0);

		const emitScrollSettled = useCallback(() => {
			runOnUI(() => {
				"worklet";
				settledSignal.value = settledSignal.value + 1;
			})();
		}, [settledSignal]);

		// Determine scroll direction from the horizontal prop (standard ScrollView API)
		const scrollDirection = scrollableProps.horizontal
			? "horizontal"
			: "vertical";

		// Get scroll handlers and the gesture owner's nativeGesture for this axis
		const { scrollHandler, onContentSizeChange, onLayout, nativeGesture } =
			useScrollRegistry({
				onContentSizeChange: scrollableProps.onContentSizeChange,
				onLayout: scrollableProps.onLayout,
				direction: scrollDirection,
			});

		const composedScrollHandler = useComposedEventHandler([
			scrollHandler,
			userOnScroll ?? null,
		]);

		const handleMomentumScrollEnd = useCallback(
			(event: unknown) => {
				userOnMomentumScrollEnd?.(event);
				emitScrollSettled();
			},
			[userOnMomentumScrollEnd, emitScrollSettled],
		);

		const handleScrollEndDrag = useCallback(
			(event: any) => {
				userOnScrollEndDrag?.(event);

				const velocityX = Math.abs(event?.nativeEvent?.velocity?.x ?? 0);
				const velocityY = Math.abs(event?.nativeEvent?.velocity?.y ?? 0);

				// If there is no momentum, onMomentumScrollEnd may not fire.
				// Emit settled signal here only when velocity is effectively zero.
				if (velocityX < 0.01 && velocityY < 0.01) {
					emitScrollSettled();
				}
			},
			[userOnScrollEndDrag, emitScrollSettled],
		);

		const scrollableComponent = (
			<AnimatedComponent
				{...(scrollableProps as any)}
				ref={ref}
				onScroll={composedScrollHandler}
				onMomentumScrollEnd={handleMomentumScrollEnd}
				onScrollEndDrag={handleScrollEndDrag}
				onContentSizeChange={onContentSizeChange}
				onLayout={onLayout}
				scrollEventThrottle={scrollableProps.scrollEventThrottle || 16}
			/>
		);

		// If no gesture owner found for this axis, render without GestureDetector
		return (
			<ScrollSettleProvider settledSignal={settledSignal}>
				{!nativeGesture ? (
					scrollableComponent
				) : (
					<GestureDetector gesture={nativeGesture}>
						{scrollableComponent}
					</GestureDetector>
				)}
			</ScrollSettleProvider>
		);
	});

	const Inner = forwardRef<
		React.ComponentRef<typeof AnimatedComponent>,
		TransitionAwareProps<P>
	>((props, _) => {
		const {
			children,
			style,
			sharedBoundTag,
			styleId,
			onPress,
			remeasureOnFocus,
			...rest
		} = props as any;

		const animatedRef = useAnimatedRef<View>();

		const { associatedStyles } = useAssociatedStyles({
			id: sharedBoundTag || styleId,
			style,
			resetTransformOnUnset: !!sharedBoundTag,
			waitForFirstResolvedStyle: false,
		});

		return (
			<RegisterBoundsProvider
				animatedRef={animatedRef}
				style={style}
				onPress={onPress}
				sharedBoundTag={sharedBoundTag}
				remeasureOnFocus={remeasureOnFocus}
			>
				{({ captureActiveOnPress, handleInitialLayout }) => (
					<AnimatedComponent
						{...(rest as any)}
						ref={animatedRef}
						style={[style, associatedStyles]}
						onPress={captureActiveOnPress}
						onLayout={runOnUI(handleInitialLayout)}
						collapsable={!sharedBoundTag}
					>
						{children}
					</AnimatedComponent>
				)}
			</RegisterBoundsProvider>
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
