import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Transition, { snapTo } from "react-native-screen-transitions";
import { useTheme } from "@/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ITEMS = Array.from({ length: 20 }, (_, index) => ({
	id: index,
	title: `Feed Row ${index + 1}`,
	description: "Drag inside list and verify snap lock behavior",
}));

export default function SnapLockScrollLockedScreen() {
	const theme = useTheme();

	return (
		<View style={[styles.container, { maxHeight: SCREEN_HEIGHT, backgroundColor: theme.bg }]}>
			<View style={[styles.handle, { backgroundColor: theme.handle }]} />
			<Text style={[styles.title, { color: theme.text }]}>Snap Lock: ScrollView</Text>
			<Text style={[styles.subtitle, { color: theme.textSecondary }]}>Scroll coordination with lock enabled</Text>

			<View style={styles.topActions}>
				<Pressable
					testID="scroll-locked-snap-to-min"
					style={({ pressed }) => [styles.actionButton, { backgroundColor: pressed ? theme.actionButtonPressed : theme.actionButton }]}
					onPress={() => snapTo(0)}
				>
					<Text style={[styles.actionText, { color: theme.actionButtonText }]}>Snap 30%</Text>
				</Pressable>
				<Pressable
					testID="scroll-locked-snap-to-mid"
					style={({ pressed }) => [styles.actionButton, { backgroundColor: pressed ? theme.actionButtonPressed : theme.actionButton }]}
					onPress={() => snapTo(1)}
				>
					<Text style={[styles.actionText, { color: theme.actionButtonText }]}>Snap 60%</Text>
				</Pressable>
				<Pressable
					testID="scroll-locked-snap-to-max"
					style={({ pressed }) => [styles.actionButton, { backgroundColor: pressed ? theme.actionButtonPressed : theme.actionButton }]}
					onPress={() => snapTo(2)}
				>
					<Text style={[styles.actionText, { color: theme.actionButtonText }]}>Snap 100%</Text>
				</Pressable>
			</View>

			<View style={[styles.card, { backgroundColor: theme.card }]}>
				<Text style={[styles.cardTitle, { color: theme.infoBoxLabel }]}>Expected</Text>
				<Text style={[styles.item, { color: theme.textSecondary }]}>
					- List scroll should still work normally
				</Text>
				<Text style={[styles.item, { color: theme.textSecondary }]}>
					- Gesture should not snap to other points
				</Text>
				<Text style={[styles.item, { color: theme.textSecondary }]}>
					- Programmatic snapTo controls still work
				</Text>
			</View>

			<Transition.ScrollView
				testID="scroll-locked-list"
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{ITEMS.map((item) => (
					<View key={item.id} style={[styles.row, { backgroundColor: theme.surfaceElevated }]}>
						<Text style={[styles.rowTitle, { color: theme.text }]}>{item.title}</Text>
						<Text style={[styles.rowDescription, { color: theme.textSecondary }]}>{item.description}</Text>
					</View>
				))}
			</Transition.ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 12,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
	},
	handle: {
		alignSelf: "center",
		width: 44,
		height: 5,
		borderRadius: 3,
		marginBottom: 18,
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
	topActions: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 14,
	},
	actionButton: {
		flex: 1,
		borderRadius: 999,
		alignItems: "center",
		paddingVertical: 9,
	},
	actionText: {
		fontSize: 12,
		fontWeight: "800",
	},
	card: {
		borderRadius: 14,
		padding: 14,
		marginBottom: 12,
	},
	cardTitle: {
		fontSize: 13,
		fontWeight: "800",
		marginBottom: 8,
	},
	item: {
		fontSize: 13,
		fontWeight: "600",
		marginBottom: 6,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 16,
	},
	row: {
		borderRadius: 14,
		padding: 14,
		marginBottom: 8,
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
