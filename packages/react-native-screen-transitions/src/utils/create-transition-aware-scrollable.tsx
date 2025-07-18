import { type ComponentType, forwardRef, memo } from "react";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { type AnimatedProps } from "react-native-reanimated";
import { useGestureContext } from "@/contexts/gesture";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import type { Any } from "@/types";

export function createTransitionAwareScrollable<P extends object>(
	ScrollableComponent: ComponentType<P>,
) {
	const AnimatedScrollableComponent =
		Animated.createAnimatedComponent(ScrollableComponent);

	type Props = AnimatedProps<P>;

	const Inner = forwardRef<
		React.ComponentRef<typeof AnimatedScrollableComponent>,
		Props
	>((props: Any, ref) => {
		const { nativeGesture } = useGestureContext();

		const { scrollHandler, onContentSizeChange } = useScrollProgress({
			onScroll: props.onScroll,
			onContentSizeChange: props.onContentSizeChange,
		});

		return (
			<GestureDetector gesture={nativeGesture}>
				<AnimatedScrollableComponent
					{...(props as Any)}
					ref={ref}
					onScroll={scrollHandler}
					onContentSizeChange={onContentSizeChange}
					scrollEventThrottle={props.scrollEventThrottle || 16}
				/>
			</GestureDetector>
		);
	});

	Inner.displayName = `Transition(${ScrollableComponent.displayName || ScrollableComponent.name || "Component"})`;

	return memo(Inner) as React.MemoExoticComponent<
		React.ForwardRefExoticComponent<
			AnimatedProps<P> &
				React.RefAttributes<React.ComponentRef<typeof ScrollableComponent>>
		>
	>;
}
