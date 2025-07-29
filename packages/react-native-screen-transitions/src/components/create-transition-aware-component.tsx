import type React from "react";
import { type ComponentType, forwardRef, memo } from "react";
import type { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { useAssociatedStyles } from "@/hooks/animations/use-associated-styles";
import { useBoundsMeasurement } from "@/hooks/bounds/use-bounds-measurement";
import { useScrollProgress } from "@/hooks/gestures/use-scroll-progress";
import { useGestureContext } from "@/navigator/contexts/gesture";
import { useScreenKeys } from "@/navigator/contexts/screen-keys";
import type { Any, TransitionAwareProps } from "@/types";
import { FlickerPrevention } from "./flicker-prevention";

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
		const { children, style, sharedBoundTag, styleId, onPress, ...rest } =
			props as Any;
		const { currentScreenKey } = useScreenKeys();

		const animatedRef = useAnimatedRef<View>();

		const { interceptedOnPress } = useBoundsMeasurement({
			sharedBoundTag,
			animatedRef,
			screenKey: currentScreenKey,
			onPress,
		});

		const { associatedStyles } = useAssociatedStyles({
			id: sharedBoundTag || styleId,
		});

		if (isScrollable) {
			return <ScrollableInner {...(props as Any)} ref={ref} />;
		}

		return (
			<FlickerPrevention id={sharedBoundTag || styleId}>
				<AnimatedComponent
					{...rest}
					ref={animatedRef}
					style={[associatedStyles, style]}
					onPress={interceptedOnPress}
				>
					{children}
				</AnimatedComponent>
			</FlickerPrevention>
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
