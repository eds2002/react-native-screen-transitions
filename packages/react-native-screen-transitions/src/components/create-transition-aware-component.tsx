import type React from "react";
import { type ComponentType, forwardRef, memo } from "react";
import type { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
	useAnimatedRef,
	useAnimatedStyle,
} from "react-native-reanimated";
import { useBoundsMeasurement } from "@/hooks/bounds/use-bounds-measurement";
import { useScrollProgress } from "@/hooks/gestures/use-scroll-progress";
import { useGestureContext } from "@/navigator/contexts/gesture";
import { useScreenKeys } from "@/navigator/contexts/screen-keys";
import { _useRootScreenAnimation } from "@/navigator/hooks/animation/use-root-screen-animation";
import type { Any, TransitionAwareProps } from "@/types";
import { additionalInterpolationProps } from "@/utils/animation/additional-interpolation-props";

import { SharedBoundsFlickerPrevention } from "./shared-bounds-flicker-prevention";

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

		const {
			screenStyleInterpolator,
			screenInterpolatorState,
			...screenInterpolationProps
		} = _useRootScreenAnimation();

		const styleIdStyle = useAnimatedStyle(() => {
			"worklet";

			const id = sharedBoundTag || styleId;

			if (!id) {
				return {};
			}

			const additionalProps = additionalInterpolationProps(
				screenInterpolationProps,
			);

			const styles = screenStyleInterpolator(additionalProps)[id];

			return styles || {};
		});

		if (isScrollable) {
			return <ScrollableInner {...(props as Any)} ref={ref} />;
		}

		return (
			<SharedBoundsFlickerPrevention
				screenInterpolatorState={screenInterpolatorState}
				baseInterpolationProps={screenInterpolationProps}
				sharedBoundTag={sharedBoundTag}
				screenKey={currentScreenKey}
			>
				<AnimatedComponent
					{...rest}
					ref={animatedRef}
					style={[styleIdStyle, style]}
					onPress={interceptedOnPress}
				>
					{children}
				</AnimatedComponent>
			</SharedBoundsFlickerPrevention>
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
