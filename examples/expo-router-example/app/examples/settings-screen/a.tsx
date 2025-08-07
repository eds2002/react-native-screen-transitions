import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";

const SETTINGS = [
	{ id: "1", title: "Wi-Fi", icon: "wifi" },
	{ id: "2", title: "Bluetooth", icon: "bluetooth" },
	{ id: "3", title: "Notifications", icon: "bell" },
	{ id: "4", title: "Privacy", icon: "user-shield" },
	{ id: "5", title: "Display", icon: "sun" },
	{ id: "6", title: "Sounds", icon: "volume-high" },
	{ id: "7", title: "Battery", icon: "battery-three-quarters" },
	{ id: "8", title: "Storage", icon: "hard-drive" },
	{ id: "9", title: "Accessibility", icon: "universal-access" },
	{ id: "10", title: "About", icon: "circle-info" },
];

const TOP_SETTINGS = [
	{
		id: "t1",
		title: "Account",
		icon: "user",
		description: "Manage your profile, passwords, and linked devices.",
	},
	{
		id: "t2",
		title: "Subscriptions",
		icon: "money-check-dollar",
		description: "View billing details and modify your plans anytime.",
	},
];

export default function A() {
	const { top } = useSafeAreaInsets();

	return (
		<Transition.ScrollView style={styles.container}>
			{/* Header */}
			<View style={[styles.header, { paddingTop: top || 0 }]}>
				<Pressable style={styles.headerSide} onPress={router.back}>
					<FontAwesome6 name="xmark" size={20} color="#111" />
				</Pressable>
				<Text style={styles.headerTitle}>Settings</Text>
				<View style={styles.headerSide} accessibilityLabel="Help">
					<FontAwesome6 name="question-circle" size={20} color="#111" />
				</View>
			</View>

			{/* Top featured settings (2 items) */}
			<View style={{ marginBottom: 16 }}>
				{TOP_SETTINGS.map((item, idx) => (
					<View key={item.id} style={styles.topRow}>
						<View style={styles.topLeft}>
							<View style={styles.topIconSlot}>
								<FontAwesome6 name={item.icon as any} size={30} color="#222" />
							</View>

							<View style={styles.topTitleBlock}>
								<Text style={styles.title} numberOfLines={1}>
									{item.title}
								</Text>
								<Text style={styles.description} numberOfLines={2}>
									{item.description}
								</Text>
								<View pointerEvents="none" style={styles.titleUnderline} />
							</View>
						</View>

						<View style={styles.right}>
							<FontAwesome6 name="chevron-right" size={12} color="#888" />
						</View>
					</View>
				))}
			</View>

			<FlatList
				data={SETTINGS}
				keyExtractor={(item) => item.id}
				ListHeaderComponent={() => <Text style={styles.label}>Settings</Text>}
				scrollEnabled={false}
				renderItem={({ item }) => (
					// Row is a fixed-height horizontal stack. We vertically center-align everything.
					<View style={[styles.row]}>
						{/* Left: fixed-width icon slot + title block. Both centered on the same vertical axis */}
						<View style={styles.left}>
							<View style={styles.iconSlot}>
								<FontAwesome6 name={item.icon as any} size={18} color="#222" />
							</View>

							{/* Title block: single-line title + separator that sits on the same baseline */}
							<View style={styles.titleBlock}>
								<Text style={styles.title} numberOfLines={1}>
									{item.title}
								</Text>
								{/* Use a bottom border on the block instead of a separate view to avoid offset */}
								<View pointerEvents="none" style={styles.titleUnderline} />
							</View>
						</View>

						{/* Right: chevron centered to the row (and thus to the title's vertical center) */}
						<View style={styles.right}>
							<FontAwesome6 name="chevron-right" size={12} color="#888" />
						</View>
					</View>
				)}
				showsVerticalScrollIndicator={false}
			/>
		</Transition.ScrollView>
	);
}

const ROW_HEIGHT = 48;
const ICON_SLOT_WIDTH = 24;

// Top rows are larger to fit bigger icons and a description
const TOP_ROW_HEIGHT = 72;
const TOP_ICON_SLOT_WIDTH = 40;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 24,
		backgroundColor: "white",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	headerSide: {
		width: 28,
		height: 28,
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111",
		textAlign: "center",
	},
	label: {
		fontSize: 12,
		fontWeight: "500",
		color: "#444",
		marginBottom: 8,
	},
	row: {
		flexDirection: "row",
		alignItems: "center", // center all row children vertically
		justifyContent: "space-between",
		minHeight: ROW_HEIGHT,
	},
	left: {
		flexDirection: "row",
		alignItems: "center", // align icon slot and title block vertically
		flex: 1,
		gap: 12,
	},
	iconSlot: {
		width: ICON_SLOT_WIDTH,
		height: ROW_HEIGHT, // ensures icon centers to the same vertical axis as title

		justifyContent: "center",
	},
	titleBlock: {
		flex: 1,
		justifyContent: "center",
		// Make the underline stick to the visual bottom of the row, not offset from text spacing
		height: ROW_HEIGHT,
	},
	title: {
		fontSize: 16,
		lineHeight: 20, // stable text metrics
		fontWeight: "600",
		color: "#111",
	},
	description: {
		marginTop: 2,
		fontSize: 13,
		lineHeight: 18,
		color: "#666",
	},
	titleUnderline: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		height: StyleSheet.hairlineWidth,
		backgroundColor: "#E0E0E0",
	},
	separator: {
		// kept for reference; unused by the new underline approach
		height: StyleSheet.hairlineWidth,
		backgroundColor: "#E0E0E0",
	},
	right: {
		marginLeft: 12,
		height: ROW_HEIGHT, // center chevron vertically to the row/title axis
		alignItems: "center",
		justifyContent: "center",
	},
	// Top list styles (same look/feel, larger size, with description)
	topRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		minHeight: TOP_ROW_HEIGHT,
	},
	topLeft: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
		gap: 12,
	},
	topIconSlot: {
		width: TOP_ICON_SLOT_WIDTH,
		height: TOP_ROW_HEIGHT,

		justifyContent: "center",
	},
	topTitleBlock: {
		flex: 1,
		justifyContent: "center",
		height: TOP_ROW_HEIGHT,
	},
});
