import type React from "react";
import {
	type ComponentType,
	forwardRef,
	memo,
	useCallback,
	useMemo,
} from "react";
import type { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	measure,
	runOnUI,
	useAnimatedRef,
} from "react-native-reanimated";
import { useAssociatedStyles } from "../hooks/animation/use-associated-style";
import { useScrollProgress } from "../hooks/gestures/use-scroll-progress";
import { useGestureContext } from "../navigator/context/gestures";
import { useKeys } from "../navigator/context/keys";
import { Bounds } from "../navigator/stores/bounds";
import type { TransitionAwareProps } from "../types/core";
import type { Any } from "../types/utils";

interface CreateTransitionAwareComponentOptions {
	isScrollable?: boolean;
	enableTapActivate?: boolean; // default true
}

interface SharedBoundSelectorProps {
	sharedBoundTag?: string;
	enableTap?: boolean;
	children: React.ReactNode;
}

const SharedBoundSelector = ({
	sharedBoundTag,
	enableTap = true,
	children,
}: SharedBoundSelectorProps) => {
	const tapGesture = useMemo(() => {
		return Gesture.Tap().onEnd((_, success) => {
			"worklet";
			if (success && sharedBoundTag) {
				Bounds.setActiveBoundId(sharedBoundTag);
			}
		});
	}, [sharedBoundTag]);

	if (!enableTap || !sharedBoundTag) return children;

	return <GestureDetector gesture={tapGesture}>{children}</GestureDetector>;
};

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

		const measureComponent = useCallback(() => {
			"worklet";
			if (!sharedBoundTag) return;
			const m = measure(animatedRef);
			if (m) {
				Bounds.setBounds(current.route.key, sharedBoundTag, m);
			}
		}, [sharedBoundTag, animatedRef, current.route.key]);

		if (isScrollable) {
			return <ScrollableInner {...(props as Any)} ref={ref} />;
		}

		return (
			<SharedBoundSelector
				sharedBoundTag={sharedBoundTag}
				enableTap={enableTapActivate}
			>
				<AnimatedComponent
					{...(rest as Any)}
					ref={animatedRef}
					style={[style, associatedStyles]}
					onPress={onPress}
					onLayout={runOnUI(measureComponent)}
				>
					{children}
				</AnimatedComponent>
			</SharedBoundSelector>
		);
	});

	return memo(Inner) as React.MemoExoticComponent<
		React.ForwardRefExoticComponent<
			TransitionAwareProps<P> &
				React.RefAttributes<React.ComponentRef<typeof Wrapped>>
		>
	>;
}
