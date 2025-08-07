import type React from "react";
import {
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import Animated, {
	interpolate,
	interpolateColor,
	type MeasuredDimensions,
	measure,
	runOnUI,
	type SharedValue,
	useAnimatedReaction,
	useAnimatedRef,
	useAnimatedStyle,
	useScrollViewOffset,
	useSharedValue,
} from "react-native-reanimated";
import type { AnimatedScrollView } from "react-native-reanimated/lib/typescript/component/ScrollView";

type RouteKey = string;

export type TabStripProps = {
	tabs: RouteKey[];
	colors?: Record<RouteKey, string>;
	renderScene: (key: RouteKey) => React.ReactNode;
	contentContainerStyle?: object;
	tabBarStyle?: object;
	tabItemStyle?: object;
	indicatorHeight?: number;
};

const AnimatedPress = Animated.createAnimatedComponent(Pressable);

const Tab = ({
	tabItemStyle,
	label,
	measurements,
}: {
	tabItemStyle: object;
	label: string;
	measurements: SharedValue<Record<string, MeasuredDimensions>>;
}) => {
	const ref = useAnimatedRef<View>();
	return (
		<AnimatedPress
			ref={ref}
			style={[styles.tabItem, tabItemStyle]}
			onLayout={() =>
				runOnUI(() => {
					const m = measure(ref);
					if (m) {
						measurements.modify((prev: any) => {
							"worklet";
							prev[label] = m;
							return prev;
						});
					}
				})()
			}
		>
			<Text style={[styles.tabLabel]}>{label}</Text>
		</AnimatedPress>
	);
};

export const TabStrip = ({
	tabs,
	renderScene,
	contentContainerStyle,
	tabBarStyle,
	tabItemStyle,
	indicatorHeight = 3,
	colors,
}: TabStripProps) => {
	const { width } = useWindowDimensions();

	const scrollRef = useAnimatedRef<AnimatedScrollView>();
	const measurements = useSharedValue<Record<string, MeasuredDimensions>>({});

	const activeIndex = useSharedValue(0);

	const scrollOffset = useScrollViewOffset(scrollRef);

	const animatedIndicatorStyle = useAnimatedStyle(() => {
		"worklet";

		const widths = tabs.map((k) => measurements.value[k]?.width ?? 0);
		const tabPageX = tabs.map((k) => measurements.value[k]?.x ?? 0);
		const clrs = tabs.map((k) => colors?.[k] ?? "black");

		const hasAllMeasurements = widths.every((w) => w > 0);
		if (!hasAllMeasurements) {
			const m = measurements.value[tabs[activeIndex.value]];
			return m ? { width: m.width } : {};
		}

		const inputRange = tabs.map((_, i) => i);
		const widthInterpolated = interpolate(
			activeIndex.value,
			inputRange,
			widths,
		);
		const xInterpolated = interpolate(activeIndex.value, inputRange, tabPageX);
		const clrInterpolated = interpolateColor(
			activeIndex.value,
			inputRange,
			clrs,
		);

		return {
			width: widthInterpolated,
			transform: [{ translateX: xInterpolated }],
			backgroundColor: clrInterpolated || "black",
			height: indicatorHeight,
		};
	});

	useAnimatedReaction(
		() => scrollOffset.value,
		(x) => {
			"worklet";
			const pageWidth = width;
			const totalPages = tabs.length;
			const rawIndex = pageWidth > 0 ? x / pageWidth : 0;
			const clampedIndex = Math.max(0, Math.min(rawIndex, totalPages - 1));

			activeIndex.value = clampedIndex;
		},
	);

	return (
		<View style={[styles.container, contentContainerStyle]}>
			<View style={[styles.tabBar, tabBarStyle]}>
				{tabs.map((key) => (
					<Tab
						key={key}
						label={key}
						measurements={measurements}
						tabItemStyle={tabItemStyle ?? {}}
					/>
				))}

				<Animated.View style={[styles.indicator, animatedIndicatorStyle]} />
			</View>

			<Animated.ScrollView
				ref={scrollRef}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				scrollEventThrottle={16}
				testID="tabstrip-scroll"
				style={{ marginHorizontal: -24 }} //Hack, but we ball
			>
				{tabs.map((key) => (
					<View
						key={key}
						style={{
							width,
						}}
						testID={`tab-page-${key}`}
					>
						<View style={{ flex: 1, padding: 24 }}>{renderScene(key)}</View>
					</View>
				))}
			</Animated.ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	tabBar: {
		flexDirection: "row",
		alignItems: "center",
		position: "relative",
		gap: 16,
	},
	tabItem: {
		paddingVertical: 6,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 4,
	},
	tabLabel: {
		fontSize: 14,
		fontWeight: "600",
	},
	indicator: {
		position: "absolute",
		bottom: -1,
		left: 0,
		borderRadius: 999,
	},
});
