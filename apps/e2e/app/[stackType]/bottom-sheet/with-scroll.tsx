import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

type SheetDirection = "bottom" | "top" | "right" | "left";
type ScrollBehavior = "expand-and-collapse" | "collapse-only";

const DIRECTIONS: { id: SheetDirection; label: string }[] = [
	{ id: "bottom", label: "Bottom" },
	{ id: "top", label: "Top" },
	{ id: "right", label: "Right" },
	{ id: "left", label: "Left" },
];

const BEHAVIORS: { id: ScrollBehavior; label: string }[] = [
	{ id: "expand-and-collapse", label: "Expand + Collapse" },
	{ id: "collapse-only", label: "Collapse Only" },
];

const ITEMS = Array.from({ length: 24 }, (_, index) => ({
	id: index,
	title: `Scrollable Row ${index + 1}`,
	description: "Scroll inside the sheet and hand off at the boundary",
}));

export default function ScrollViewIntegrationScreen() {
	const navigation = useNavigation<any>();
	const [direction, setDirection] = useState<SheetDirection>("bottom");
	const [behavior, setBehavior] = useState<ScrollBehavior>(
		"expand-and-collapse",
	);
	const theme = useTheme();

	const isHorizontal = direction === "left" || direction === "right";
	const gestureDirection = useMemo(() => {
		switch (direction) {
			case "top":
				return "vertical-inverted";
			case "right":
				return "horizontal";
			case "left":
				return "horizontal-inverted";
			default:
				return "vertical";
		}
	}, [direction]);

	useEffect(() => {
		navigation.setOptions({
			gestureDirection,
			sheetScrollGestureBehavior: behavior,
			screenStyleInterpolator: ({
				layouts: {
					screen: { height, width },
				},
				progress,
			}: any) => {
				"worklet";
				const scale = interpolate(progress, [1.5, 2], [1, 0.95], "clamp");

				if (direction === "top") {
					const y = interpolate(progress, [0, 1], [-height, 0], "clamp");
					return {
						content: { style: { transform: [{ translateY: y }, { scale }] } },
					};
				}

				if (direction === "right") {
					const x = interpolate(progress, [0, 1], [width, 0], "clamp");
					return {
						content: { style: { transform: [{ translateX: x }, { scale }] } },
					};
				}

				if (direction === "left") {
					const x = interpolate(progress, [0, 1], [-width, 0], "clamp");
					return {
						content: { style: { transform: [{ translateX: x }, { scale }] } },
					};
				}

				const y = interpolate(progress, [0, 1], [height, 0], "clamp");
				return {
					content: { style: { transform: [{ translateY: y }, { scale }] } },
				};
			},
		});
	}, [behavior, direction, gestureDirection, navigation]);

	return (
		<View
			style={[
				styles.container,
				isHorizontal
					? { maxWidth: SCREEN_WIDTH * 0.8 }
					: { maxHeight: SCREEN_HEIGHT * 0.8 },
				direction === "bottom" && styles.fromBottom,
				direction === "top" && styles.fromTop,
				direction === "right" && styles.fromRight,
				direction === "left" && styles.fromLeft,
				{ backgroundColor: theme.bg },
			]}
		>
			<View
				style={[
					isHorizontal ? styles.horizontalShell : styles.verticalShell,
					direction === "left" && styles.leftShell,
				]}
			>
				{isHorizontal && direction === "right" && <Handle horizontal />}
				<View style={styles.content}>
					{!isHorizontal && <Handle />}
					<Text style={[styles.title, { color: theme.text }]}>
						ScrollView Integration
					</Text>
					<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
						Dynamic sheet direction and scroll handoff behavior
					</Text>

					<View style={styles.controlGroup}>
						<Text style={[styles.controlLabel, { color: theme.textSecondary }]}>
							Direction
						</Text>
						<View style={styles.segmentRow}>
							{DIRECTIONS.map((item) => (
								<SegmentButton
									key={item.id}
									label={item.label}
									active={direction === item.id}
									onPress={() => setDirection(item.id)}
								/>
							))}
						</View>
					</View>

					<View style={styles.controlGroup}>
						<Text style={[styles.controlLabel, { color: theme.textSecondary }]}>
							Scroll Behavior
						</Text>
						<View style={styles.segmentRow}>
							{BEHAVIORS.map((item) => (
								<SegmentButton
									key={item.id}
									label={item.label}
									active={behavior === item.id}
									onPress={() => setBehavior(item.id)}
								/>
							))}
						</View>
					</View>

					<Transition.ScrollView
						testID="scrollview-integration-list"
						style={styles.scrollView}
						horizontal={isHorizontal}
						contentContainerStyle={[
							styles.scrollContent,
							isHorizontal && styles.horizontalScrollContent,
						]}
						showsHorizontalScrollIndicator={false}
						showsVerticalScrollIndicator={false}
					>
						{ITEMS.map((item) => (
							<View
								key={item.id}
								style={[
									styles.row,
									isHorizontal && styles.horizontalRow,
									{ backgroundColor: theme.surfaceElevated },
								]}
							>
								<Text style={[styles.rowTitle, { color: theme.text }]}>
									{item.title}
								</Text>
								<Text
									style={[
										styles.rowDescription,
										{ color: theme.textSecondary },
									]}
								>
									{item.description}
								</Text>
							</View>
						))}
					</Transition.ScrollView>
				</View>
				{isHorizontal && direction === "left" && <Handle horizontal />}
			</View>
		</View>
	);
}

function SegmentButton({
	label,
	active,
	onPress,
}: {
	label: string;
	active: boolean;
	onPress: () => void;
}) {
	const theme = useTheme();

	return (
		<Pressable
			style={[
				styles.segmentButton,
				{ backgroundColor: active ? theme.activePill : theme.pill },
			]}
			onPress={onPress}
		>
			<Text
				style={[
					styles.segmentText,
					{ color: active ? theme.activePillText : theme.pillText },
				]}
			>
				{label}
			</Text>
		</Pressable>
	);
}

function Handle({ horizontal }: { horizontal?: boolean }) {
	const theme = useTheme();

	return (
		<View
			style={[
				horizontal ? styles.horizontalHandle : styles.handle,
				{ backgroundColor: theme.handle },
			]}
		/>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	fromBottom: {
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
	},
	fromTop: {
		borderBottomLeftRadius: 28,
		borderBottomRightRadius: 28,
	},
	fromRight: {
		borderTopLeftRadius: 28,
		borderBottomLeftRadius: 28,
	},
	fromLeft: {
		borderTopRightRadius: 28,
		borderBottomRightRadius: 28,
	},
	verticalShell: {
		flex: 1,
		paddingTop: 12,
	},
	horizontalShell: {
		flex: 1,
		flexDirection: "row",
	},
	leftShell: {
		flexDirection: "row",
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 12,
	},
	handle: {
		alignSelf: "center",
		width: 44,
		height: 5,
		borderRadius: 3,
		marginBottom: 18,
	},
	horizontalHandle: {
		alignSelf: "center",
		width: 5,
		height: 44,
		borderRadius: 3,
		marginHorizontal: 10,
	},
	title: {
		fontSize: 28,
		fontWeight: "900",
		marginBottom: 6,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 14,
	},
	controlGroup: {
		marginBottom: 12,
	},
	controlLabel: {
		fontSize: 12,
		fontWeight: "800",
		marginBottom: 8,
		textTransform: "uppercase",
	},
	segmentRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	segmentButton: {
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	segmentText: {
		fontSize: 12,
		fontWeight: "800",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 16,
	},
	horizontalScrollContent: {
		paddingRight: 16,
	},
	row: {
		borderRadius: 14,
		padding: 14,
		marginBottom: 8,
	},
	horizontalRow: {
		width: 180,
		marginBottom: 0,
		marginRight: 8,
	},
	rowTitle: {
		fontSize: 14,
		fontWeight: "800",
		marginBottom: 4,
	},
	rowDescription: {
		fontSize: 12,
		fontWeight: "600",
	},
});
