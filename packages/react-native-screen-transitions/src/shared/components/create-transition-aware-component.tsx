/** biome-ignore-all lint/style/noNonNullAssertion: <This helper is usually being used inside a transitionable stack> */
import type React from "react";
import { type ComponentType, forwardRef, memo } from "react";
import type { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
	runOnUI,
	useAnimatedProps,
	useAnimatedRef,
	useAnimatedStyle,
	useComposedEventHandler,
} from "react-native-reanimated";
import { NO_PROPS, NO_STYLES } from "../constants";
import { RegisterBoundsProvider } from "../providers/register-bounds.provider";
import { useScrollGestureCoordination } from "../providers/screen/gestures/hooks/use-scroll-gesture-coordination";
import { useScreenStyles } from "../providers/screen/styles";
import type { TransitionAwareProps } from "../types/screen.types";

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
			remeasureOnFocus: _remeasureOnFocus,
			onScroll: userOnScroll,
			onMomentumScrollEnd: userOnMomentumScrollEnd,
			onScrollEndDrag: userOnScrollEndDrag,
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
			/>
		);

		if (!nativeGesture) {
			return scrollableComponent;
		}

		return (
			<GestureDetector gesture={nativeGesture}>
				{scrollableComponent}
			</GestureDetector>
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
		const { stylesMap } = useScreenStyles();
		const associatedId = sharedBoundTag || styleId;

		const associatedStyles = useAnimatedStyle(() => {
			"worklet";

			if (!associatedId) {
				return NO_STYLES;
			}

			return stylesMap.get()[associatedId]?.style ?? NO_STYLES;
		});

		const associatedProps = useAnimatedProps(() => {
			"worklet";

			if (!associatedId) {
				return NO_PROPS;
			}

			return stylesMap.get()[associatedId]?.props ?? NO_PROPS;
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
						animatedProps={associatedProps}
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
