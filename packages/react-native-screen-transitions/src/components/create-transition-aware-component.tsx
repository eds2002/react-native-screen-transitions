/** biome-ignore-all lint/style/noNonNullAssertion: <This helper is usually being used inside a transitionable stack> */
import type React from "react";
import { type ComponentType, forwardRef, memo } from "react";
import type { LayoutChangeEvent } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useComposedEventHandler } from "react-native-reanimated";
import {
	ScrollMetadataOwnerProvider,
	useScrollGestureCoordination,
} from "../providers/screen/motion/gestures/scroll-coordination";
import {
	useSlotProps,
	useSlotStyles,
} from "../providers/screen/orchestrator/styles";
import type { TransitionAwareProps } from "../types/screen.types";
import { useContentLayout } from "./screen/container/hooks/use-content-layout";

interface CreateTransitionAwareComponentOptions {
	isScrollable?: boolean;
	alreadyAnimated?: boolean;
}

export function createTransitionAwareComponent<P extends object>(
	Wrapped: ComponentType<P>,
	options: CreateTransitionAwareComponentOptions = {},
) {
	const { isScrollable = false, alreadyAnimated = false } = options;

	const AnimatedComponent = alreadyAnimated
		? Wrapped
		: Animated.createAnimatedComponent(Wrapped);

	const ScrollableInner = forwardRef<
		React.ComponentRef<typeof Wrapped>,
		TransitionAwareProps<P>
	>((props: any, ref) => {
		const {
			onScroll: userOnScroll,
			onMomentumScrollEnd: userOnMomentumScrollEnd,
			onScrollEndDrag: userOnScrollEndDrag,
			children,
			contentContainerStyle,
			...scrollableProps
		} = props;

		// Determine scroll direction from the horizontal prop (standard ScrollView API)
		const scrollDirection = scrollableProps.horizontal
			? "horizontal"
			: "vertical";

		// Get scroll handlers and the gesture owner's nativeGesture for this axis
		const {
			scrollHandler,
			scrollEventsEnabled,
			onContentSizeChange,
			onLayout,
			nativeGesture,
			metadataOwnerProviderValue,
		} = useScrollGestureCoordination({
			onContentSizeChange: scrollableProps.onContentSizeChange,
			onLayout: scrollableProps.onLayout,
			direction: scrollDirection,
		});

		const composedScrollHandler = useComposedEventHandler([
			scrollHandler,
			userOnScroll ?? null,
		]);
		const scrollableComponent = (
			<AnimatedComponent
				{...(scrollableProps as any)}
				ref={ref}
				contentContainerStyle={contentContainerStyle}
				/**
				 * Keep the scroll listener detached while the owning gesture screen is
				 * closing. On iOS, a bounced ScrollView can keep sending native scroll
				 * events after the transition gesture activates, which competes with
				 * close animation work on the UI thread.
				 */
				onScroll={scrollEventsEnabled ? composedScrollHandler : undefined}
				onMomentumScrollEnd={userOnMomentumScrollEnd}
				onScrollEndDrag={userOnScrollEndDrag}
				onContentSizeChange={onContentSizeChange}
				onLayout={onLayout}
				scrollEventThrottle={
					scrollEventsEnabled
						? scrollableProps.scrollEventThrottle || 16
						: undefined
				}
			>
				{children}
			</AnimatedComponent>
		);

		const coordinatedScrollableComponent = nativeGesture ? (
			<GestureDetector gesture={nativeGesture}>
				{scrollableComponent}
			</GestureDetector>
		) : (
			scrollableComponent
		);

		return (
			<ScrollMetadataOwnerProvider value={metadataOwnerProviderValue}>
				{coordinatedScrollableComponent}
			</ScrollMetadataOwnerProvider>
		);
	});

	const Inner = forwardRef<
		React.ComponentRef<typeof AnimatedComponent>,
		TransitionAwareProps<P>
	>((props, ref) => {
		const {
			children,
			style,
			styleId,
			onLayout,
			animatedProps: userAnimatedProps,
			...rest
		} = props as any;

		const associatedStyles = useSlotStyles(styleId);
		const associatedProps = useSlotProps(styleId);
		const measureLayout = useContentLayout(styleId);

		return (
			<AnimatedComponent
				{...(rest as any)}
				ref={ref}
				onLayout={
					measureLayout
						? (event: LayoutChangeEvent) => {
								measureLayout(event);
								onLayout?.(event);
							}
						: onLayout
				}
				style={[style, associatedStyles]}
				animatedProps={userAnimatedProps ?? associatedProps}
			>
				{children}
			</AnimatedComponent>
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
