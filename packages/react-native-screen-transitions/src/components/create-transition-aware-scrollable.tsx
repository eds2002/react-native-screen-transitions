import { type ComponentType, forwardRef, memo } from "react";
import { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { type AnimatedProps } from "react-native-reanimated";
import { useGestureContext } from "@/contexts/gesture";
import { useScrollProgress } from "@/hooks/gestures/use-scroll-progress";
import type { Any } from "@/types";
import { createTransitionAwareComponent } from "@/utils";

export function createTransitionAwareScrollable<P extends object>(
	ScrollableComponent: ComponentType<P>,
) {
	const WithTransitionAwareness = createTransitionAwareComponent(View);
	const AnimatedScrollableComponent =
		Animated.createAnimatedComponent(ScrollableComponent);

	type Props = AnimatedProps<P>;

	const WithScrollAwareness = forwardRef<
		React.ComponentRef<typeof ScrollableComponent>,
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

	const Wrapped = forwardRef<
		React.ComponentRef<typeof ScrollableComponent>,
		Props
	>((props: Any, ref) => {
		const { isPlaceholder } = useGestureContext();

		if (isPlaceholder) {
			return (
				<WithTransitionAwareness>
					<WithScrollAwareness {...props} ref={ref} />
				</WithTransitionAwareness>
			);
		}

		return <WithScrollAwareness {...props} ref={ref} />;
	});

	WithScrollAwareness.displayName = `Transition(${ScrollableComponent.displayName || ScrollableComponent.name || "Component"})`;

	return memo(Wrapped) as React.MemoExoticComponent<
		React.ForwardRefExoticComponent<
			AnimatedProps<P> &
				React.RefAttributes<React.ComponentRef<typeof ScrollableComponent>>
		>
	>;
}
