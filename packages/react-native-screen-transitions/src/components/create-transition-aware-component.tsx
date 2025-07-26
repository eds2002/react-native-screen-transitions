import type React from "react";
import {
	type ComponentType,
	createContext,
	forwardRef,
	memo,
	useContext,
} from "react";
import { StyleSheet } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { type AnimatedProps } from "react-native-reanimated";
import { TransitionGestureHandlerProvider } from "@/components/transition-gesture-handler-provider";
import { useGestureContext } from "@/contexts/gesture";
import { useInterpolatorStyles } from "@/hooks/use-interpolator-styles";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import type { Any, TransitionAwareProps } from "@/types";
import { useKey } from "../hooks/use-key";
import { useSkipFirstFrame } from "../hooks/use-skip-first-frame";

const TransitionNestingContext = createContext<Record<string, number>>({});

interface CreateTransitionAwareComponentOptions {
	isScrollable?: boolean;
}

const RootWrapper = forwardRef<
	Any,
	{
		children: React.ReactNode;
		screenKey: string;
		nestingMap: Record<string, number>;
	}
>(({ children, screenKey, nestingMap }, ref) => {
	const newNestingMap = {
		...nestingMap,
		[screenKey]: (nestingMap[screenKey] || 0) + 1,
	};

	const { overlayStyle, contentStyle } = useInterpolatorStyles();

	const { style: flickerFixStyle } = useSkipFirstFrame();

	return (
		<TransitionNestingContext.Provider value={newNestingMap}>
			<TransitionGestureHandlerProvider>
				<Animated.View style={[{ flex: 1 }, flickerFixStyle]}>
					<Animated.View
						style={[StyleSheet.absoluteFillObject, overlayStyle]}
						pointerEvents="none"
					/>
					<Animated.View ref={ref} style={[{ flex: 1 }, contentStyle]}>
						{children}
					</Animated.View>
				</Animated.View>
			</TransitionGestureHandlerProvider>
		</TransitionNestingContext.Provider>
	);
});

export function createTransitionAwareComponent<P extends object>(
	Wrapped: ComponentType<P>,
	options: CreateTransitionAwareComponentOptions = {},
) {
	const { isScrollable = false } = options;

	const AnimatedComponent = Animated.createAnimatedComponent(Wrapped);



	const ScrollableInner = forwardRef<React.ComponentRef<typeof Wrapped>, TransitionAwareProps<P>>(
  		(props: Any, ref) => {
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
		},
	);

	const Inner = forwardRef<React.ComponentRef<typeof AnimatedComponent>, TransitionAwareProps<P>>(
		(props, ref) => {
			const { children, style, ...rest } = props as Any;
			const screenKey = useKey();
			const nestingMap = useContext(TransitionNestingContext);

			const nestingDepth = nestingMap[screenKey] || 0;
			const isNested = nestingDepth > 0;

			if (isScrollable) {
				return isNested ? (
					<ScrollableInner {...(props as Any)} ref={ref} />
				) : (
					<RootWrapper screenKey={screenKey} nestingMap={nestingMap}>
						<ScrollableInner {...(props as Any)} ref={ref} />
					</RootWrapper>
				);
			}

			return isNested ? (
				<AnimatedComponent {...rest} ref={ref} style={[{ flex: 1 }, style]}>
					{children}
				</AnimatedComponent>
			) : (
				<RootWrapper screenKey={screenKey} nestingMap={nestingMap}>
					<AnimatedComponent {...rest} ref={ref} style={[{ flex: 1 }, style]}>
						{children}
					</AnimatedComponent>
				</RootWrapper>
			);
		},
	);

	Inner.displayName = `Transition(${Wrapped.displayName || Wrapped.name || "Component"})`;

	return memo(Inner) as React.MemoExoticComponent<
		React.ForwardRefExoticComponent<
			TransitionAwareProps<P> & React.RefAttributes<React.ComponentRef<typeof Wrapped>>
		>
	>;
}
