import type React from "react";
import { memo, useCallback, useState } from "react";
import type {
	LayoutChangeEvent,
	LayoutRectangle,
	ViewStyle,
} from "react-native";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
	Easing,
	interpolate,
	interpolateColor,
	runOnJS,
	useAnimatedReaction,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import type { MeasuredDimensions } from "react-native-screens/lib/typescript/native-stack/types";

/**
 * Hook to handle the active segment indicator logic
 */
const useActiveSegmentIndicator = ({
	activeIndex,
	segmentLayouts,
	swipingIndex,
	style,
}: UseActiveSegmentIndicatorProps) => {
	const isInitialRender = useSharedValue(true);

	/**
	 * Get the height of the active segment
	 */
	const height = useDerivedValue(
		() => segmentLayouts.value[swipingIndex.value ?? activeIndex.value]?.height,
	);

	/**
	 * Get the width of the active segment
	 */
	const width = useDerivedValue(() => {
		const activeLayout =
			segmentLayouts.value[swipingIndex.value ?? activeIndex.value];

		if (!activeLayout) return 0;

		if (isInitialRender.value) {
			isInitialRender.value = false;
			return activeLayout.width;
		}

		return withTiming(activeLayout.width, {
			duration: 500,
			easing: Easing.bezierFn(0.22, 1, 0.36, 1),
		});
	});

	/**
	 * Get the x position of the active segment
	 */
	const translateX = useDerivedValue(() => {
		const activeLayout =
			segmentLayouts.value[swipingIndex.value ?? activeIndex.value];

		if (!activeLayout) return 0;

		return withTiming(activeLayout.x, {
			duration: 500,
			easing: Easing.bezierFn(0.22, 1, 0.36, 1),
		});
	});

	/**
	 * Scale the active segment indicator when swiping
	 */
	const scaleDV = useDerivedValue(() => {
		return swipingIndex.value !== null
			? withTiming(1, {
					duration: 500,
					easing: Easing.bezierFn(0.22, 1, 0.36, 1),
				})
			: withTiming(0, {
					duration: 500,
					easing: Easing.bezierFn(0.22, 1, 0.36, 1),
				});
	});

	return useAnimatedStyle(() => {
		const scale = interpolate(scaleDV.value, [0, 1], [1, 0.9]);
		return {
			height: height.value,
			width: width.value,
			transform: [{ translateX: translateX.value }, { scale }],
			backgroundColor: "#3b82f6",
			borderRadius: 999,
			...style,
		};
	});
};

/**
 * Hook to handle the segment logic
 */
const useSegment = ({
	index,
	activeIndex,
	segmentLayouts,
	options,
	swipingIndex,
	style,
	textStyle,
	blockedSegmentIndices,
	onBlockedSegmentAttempt,
	onDirectionChanged,
}: UseSegmentProps) => {
	/**
	 * Used to enable or disable the pan gesture. Cannot swipe on a segment that is not active.
	 */
	const [isActive, setIsActive] = useState(false);

	/**
	 * Used to animate the segment when swiping or when the segment is active
	 */
	const isActiveDV = useDerivedValue(() => {
		if (swipingIndex.value !== null) {
			return swipingIndex.value === index
				? withTiming(1, {
						duration: 500,
						easing: Easing.bezierFn(0.22, 1, 0.36, 1),
					})
				: withTiming(0, {
						duration: 500,
						easing: Easing.bezierFn(0.22, 1, 0.36, 1),
					});
		}

		return isActive
			? withTiming(1, {
					duration: 500,
					easing: Easing.bezierFn(0.22, 1, 0.36, 1),
				})
			: withTiming(0, {
					duration: 500,
					easing: Easing.bezierFn(0.22, 1, 0.36, 1),
				});
	});

	/**
	 * Tap gesture to select the segment, tap can work on a segment that is an active or inactive state
	 */
	const tap = Gesture.Tap().onEnd(() => {
		if (blockedSegmentIndices?.includes(index)) {
			if (onBlockedSegmentAttempt) {
				runOnJS(onBlockedSegmentAttempt)();
			}
			return;
		}

		const previousIndex = activeIndex.value;
		const newIndex = index;
		if (previousIndex !== newIndex && onDirectionChanged) {
			runOnJS(onDirectionChanged)(newIndex > previousIndex ? 1 : 0);
		}
		activeIndex.value = index;
	});

	/**
	 * Pan gesture to swipe the segment
	 */
	const swipe = Gesture.Pan()
		.enabled(isActive)
		.onChange((event) => {
			const containerWidth = segmentLayouts.value.root.width;

			const startsAtX = segmentLayouts.value.root.x;

			// Find which index is closest based on the event.translationX and the startsAtX and endsAtX
			const currentPosition = event.absoluteX;
			const segmentWidth = containerWidth / options.length;
			const newIndex = Math.round((currentPosition - startsAtX) / segmentWidth);

			if (newIndex >= 0 && newIndex < options.length) {
				swipingIndex.value = newIndex;
			}
		})
		.onEnd(() => {
			if (blockedSegmentIndices?.includes(swipingIndex.value ?? 0)) {
				swipingIndex.value = null;

				if (onBlockedSegmentAttempt) {
					runOnJS(onBlockedSegmentAttempt)();
				}
				// If the segment is blocked, set the active index to the previous index, otherwise set the active index to the current index
				activeIndex.value = blockedSegmentIndices.includes(index)
					? index - 1
					: index;
			} else {
				// Determine the direction based on the difference between current and previous indices
				const previousIndex = activeIndex.value;
				const newIndex = swipingIndex.value ?? 0;

				// Only trigger direction change if indices are different
				if (previousIndex !== newIndex && onDirectionChanged) {
					runOnJS(onDirectionChanged)(newIndex > previousIndex ? 1 : 0);
				}
				activeIndex.value = swipingIndex.value ?? 0;
				swipingIndex.value = null;
			}
		});

	const backgroundStyles = useAnimatedStyle(() => {
		const output = [
			textStyle?.inactiveScale ?? 1,
			textStyle?.activeScale ?? 0.9,
		];

		const scale = interpolate(isActiveDV.value, [0, 1], output);

		return {
			transform: [{ scale }],
			...style,
		};
	});

	const textStyles = useAnimatedStyle(() => {
		const output = [
			textStyle?.inactiveColor ?? "black",
			textStyle?.activeColor ?? "white",
		];

		const color = interpolateColor(isActiveDV.value, [0, 1], output);

		return { color, ...textStyle };
	});

	const gesture = Gesture.Race(swipe, tap);

	/**
	 * Reaction to the active index to update the active index
	 */
	useAnimatedReaction(
		() => activeIndex.value,
		(value) => {
			if (value === index) {
				runOnJS(setIsActive)(true);
			} else {
				runOnJS(setIsActive)(false);
			}
		},
	);

	return {
		isActive,
		gesture,
		backgroundStyles,
		textStyles,
	};
};

/**
 * Hook to handle the controller logic for the segmented control
 */
const useSegmentController = ({
	initialActiveIndex = 0,
	onActiveSegmentChanged,
}: {
	initialActiveIndex?: number;
	onActiveSegmentChanged: (segment: number) => void;
}) => {
	/**
	 * The current active index of the segmented control.
	 */
	const activeIndex = useSharedValue(initialActiveIndex);

	/**
	 * The layout of each segment of the segmented control including the root container
	 */
	const segmentLayouts = useSharedValue<Record<number | "root", Layout>>({
		root: {} as Layout,
	});

	/**
	 * The index of the segment that is currently being swiped. If null, the active index is used.
	 */
	const swipingIndex = useSharedValue<number | null>(null);

	/**
	 * On layout handler for the segmented control
	 */
	const onLayout = useCallback(
		(event: LayoutChangeEvent, key: number | "root") => {
			const layout = event.nativeEvent.layout;

			segmentLayouts.modify((currentLayouts) => {
				"worklet";
				currentLayouts[key] = layout;
				return currentLayouts;
			});
		},
		[segmentLayouts],
	);

	/**
	 * Reaction to the active index to update the active index
	 */
	useAnimatedReaction(
		() => activeIndex.value,
		(value) => {
			runOnJS(onActiveSegmentChanged)(value);
		},
	);

	return {
		activeIndex,
		segmentLayouts,
		swipingIndex,
		onLayout,
	};
};

const ActiveSegmentIndicator = ({
	activeIndex,
	segmentLayouts,
	swipingIndex,
	style,
}: ActiveSegmentIndicatorProps) => {
	const animatedStyles = useActiveSegmentIndicator({
		activeIndex,
		segmentLayouts,
		swipingIndex,
		style,
	});

	return (
		<View
			style={{
				position: "absolute",
				bottom: 0,
				left: 0,
				right: 0,
				zIndex: -1,
			}}
			pointerEvents="box-none"
		>
			<Animated.View style={animatedStyles} />
		</View>
	);
};

const Segment = memo(
	({
		option,
		index,
		activeIndex,
		segmentLayouts,
		options,
		swipingIndex,
		style,
		textStyle,
		onLayout,
		blockedSegmentIndices,
		onBlockedSegmentAttempt,
		onDirectionChanged,
	}: SegmentProps) => {
		const { gesture, backgroundStyles, textStyles } = useSegment({
			index,
			activeIndex,
			segmentLayouts,
			options,
			swipingIndex,
			style,
			textStyle,
			blockedSegmentIndices,
			onBlockedSegmentAttempt,
			onDirectionChanged,
		});

		return (
			<GestureDetector gesture={gesture}>
				<Animated.View
					style={[
						styles.segmentContainer,
						backgroundStyles,
						style,
						{ zIndex: 1 },
					]}
					collapsable={false}
					onLayout={(event) => onLayout(event, index)}
				>
					{typeof option === "string" ? (
						<Animated.Text
							numberOfLines={1}
							style={[styles.segmentText, textStyles, textStyle]}
						>
							{option}
						</Animated.Text>
					) : (
						option
					)}
				</Animated.View>
			</GestureDetector>
		);
	},
);

export const SegmentedControl = ({
	initialActiveIndex = 0,
	segments,
	onActiveSegmentChanged,
	style,
	blockedSegmentIndices,
	onBlockedSegmentAttempt,
	onDirectionChanged,
}: SegmentedControlProps) => {
	const { activeIndex, segmentLayouts, swipingIndex, onLayout } =
		useSegmentController({
			initialActiveIndex,
			onActiveSegmentChanged,
		});

	const RootComponent = View;
	return (
		<RootComponent
			style={[styles.container, style?.container]}
			onLayout={(event) => onLayout(event, "root")}
		>
			<View style={{ flexDirection: "row", gap: 12, position: "relative" }}>
				{segments.map((option, index) => (
					<Segment
						key={index.toString()}
						option={option}
						index={index}
						activeIndex={activeIndex}
						segmentLayouts={segmentLayouts}
						options={segments}
						swipingIndex={swipingIndex}
						style={style?.segment}
						textStyle={style?.text}
						onLayout={onLayout}
						blockedSegmentIndices={blockedSegmentIndices}
						onBlockedSegmentAttempt={onBlockedSegmentAttempt}
						onDirectionChanged={onDirectionChanged}
					/>
				))}
				<ActiveSegmentIndicator
					activeIndex={activeIndex}
					segmentLayouts={segmentLayouts}
					swipingIndex={swipingIndex}
					style={style?.activeSegmentIndicator}
				/>
			</View>
		</RootComponent>
	);
};

SegmentedControl.Text = ({ children }: { children: React.ReactNode }) => {
	return (
		<Animated.Text style={[styles.segmentText, { color: "black" }]}>
			{children}
		</Animated.Text>
	);
};

SegmentedControl.TextContainer = ({
	children,
	style,
}: {
	children: React.ReactNode;
	style?: ViewStyle;
}) => {
	return <View style={[styles.textContainer, style]}>{children}</View>;
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		gap: 12,
		alignSelf: "flex-start",
		padding: 4,
		borderRadius: 9999,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	segmentContainer: {
		padding: 8,
		borderRadius: 999,
	},
	segmentText: {
		fontSize: 15,
		fontWeight: "600",
	},

	textContainer: {
		flexDirection: "row",
		gap: 4,
		alignItems: "center",
		justifyContent: "center",
	},
});

type Layout = MeasuredDimensions | LayoutRectangle;

interface ActiveSegmentIndicatorProps {
	activeIndex: SharedValue<number>;
	segmentLayouts: SharedValue<Record<number | "root", Layout>>;
	swipingIndex: SharedValue<number | null>;
	style?: ViewStyle;
}

interface SegmentProps {
	option: string | React.ReactNode;
	index: number;
	activeIndex: SharedValue<number>;
	segmentLayouts: SharedValue<Record<number | "root", Layout>>;
	options: (string | React.ReactNode)[];
	swipingIndex: SharedValue<number | null>;
	style?: ViewStyle;
	onLayout: (event: LayoutChangeEvent, key: number | "root") => void;
	textStyle?: TextStyle;
	blockedSegmentIndices?: number[];
	onBlockedSegmentAttempt?: () => void;
	onDirectionChanged?: (direction: 0 | 1) => void;
}

interface SegmentedControlProps {
	/**
	 * The segments to display in the segmented control.
	 */
	segments: (string | React.ReactNode)[];
	/**
	 * The callback to call when the active segment changes.
	 */
	onActiveSegmentChanged: (segment: number) => void;
	/**
	 * The index of the initial active segment.
	 */
	initialActiveIndex?: number;
	/**
	 * Indices of the segments that are blocked from being swiped.
	 */
	blockedSegmentIndices?: number[];
	/**
	 * The callback to call when a blocked segment is attempted to be swiped.
	 */
	onBlockedSegmentAttempt?: () => void;
	/**
	 * The callback to call when the direction of the segmented control changes.
	 */
	onDirectionChanged?: (direction: 0 | 1) => void;

	style?: {
		container?: ViewStyle;
		segment?: ViewStyle;
		activeSegmentIndicator?: ViewStyle;
		text?: TextStyle;
		rootComponent?: "normal" | "blur";
	};
}

interface UseSegmentProps {
	index: number;
	activeIndex: SharedValue<number>;
	segmentLayouts: SharedValue<Record<number | "root", Layout>>;
	options: (string | React.ReactNode)[];
	swipingIndex: SharedValue<number | null>;
	style?: ViewStyle;
	textStyle?: TextStyle;
	blockedSegmentIndices?: number[];
	onBlockedSegmentAttempt?: () => void;
	onDirectionChanged?: (number: 0 | 1) => void;
}

interface TextStyle {
	activeColor?: string;
	inactiveColor?: string;
	activeScale?: number;
	inactiveScale?: number;
	fontSize?: number;
}

interface UseActiveSegmentIndicatorProps {
	activeIndex: SharedValue<number>;
	segmentLayouts: SharedValue<Record<number | "root", Layout>>;
	swipingIndex: SharedValue<number | null>;
	style?: ViewStyle;
}
