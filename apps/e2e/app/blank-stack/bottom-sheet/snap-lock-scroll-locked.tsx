import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Transition, { snapTo } from "react-native-screen-transitions";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ITEMS = Array.from({ length: 20 }, (_, index) => ({
	id: index,
	title: `Feed Row ${index + 1}`,
	description: "Drag inside list and verify snap lock behavior",
}));

export default function SnapLockScrollLockedScreen() {
	return (
		<View style={[styles.container, { maxHeight: SCREEN_HEIGHT }]}>
			<View style={styles.handle} />
			<Text style={styles.title}>Snap Lock: ScrollView</Text>
			<Text style={styles.subtitle}>Scroll coordination with lock enabled</Text>

			<View style={styles.topActions}>
				<Pressable
					testID="scroll-locked-snap-to-min"
					style={styles.actionButton}
					onPress={() => snapTo(0)}
				>
					<Text style={styles.actionText}>Snap 30%</Text>
				</Pressable>
				<Pressable
					testID="scroll-locked-snap-to-mid"
					style={styles.actionButton}
					onPress={() => snapTo(1)}
				>
					<Text style={styles.actionText}>Snap 60%</Text>
				</Pressable>
				<Pressable
					testID="scroll-locked-snap-to-max"
					style={styles.actionButton}
					onPress={() => snapTo(2)}
				>
					<Text style={styles.actionText}>Snap 100%</Text>
				</Pressable>
			</View>

			<View style={styles.card}>
				<Text style={styles.cardTitle}>Expected</Text>
				<Text style={styles.item}>
					- List scroll should still work normally
				</Text>
				<Text style={styles.item}>
					- Gesture should not snap to other points
				</Text>
				<Text style={styles.item}>
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
					<View key={item.id} style={styles.row}>
						<Text style={styles.rowTitle}>{item.title}</Text>
						<Text style={styles.rowDescription}>{item.description}</Text>
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
		backgroundColor: "#1f1a10",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
	},
	handle: {
		alignSelf: "center",
		width: 44,
		height: 5,
		borderRadius: 3,
		backgroundColor: "rgba(255,255,255,0.2)",
		marginBottom: 18,
	},
	title: {
		fontSize: 28,
		fontWeight: "900",
		color: "#fff",
		marginBottom: 6,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "rgba(255,255,255,0.55)",
		marginBottom: 14,
	},
	topActions: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 14,
	},
	actionButton: {
		flex: 1,
		borderRadius: 12,
		backgroundColor: "rgba(253,203,110,0.22)",
		alignItems: "center",
		paddingVertical: 9,
	},
	actionText: {
		fontSize: 12,
		fontWeight: "800",
		color: "#fff3d6",
	},
	card: {
		backgroundColor: "rgba(255,255,255,0.08)",
		borderRadius: 16,
		padding: 14,
		marginBottom: 12,
	},
	cardTitle: {
		fontSize: 13,
		fontWeight: "800",
		color: "#ffde8e",
		marginBottom: 8,
	},
	item: {
		fontSize: 13,
		fontWeight: "600",
		color: "rgba(255,255,255,0.75)",
		marginBottom: 6,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 16,
	},
	row: {
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 14,
		padding: 14,
		marginBottom: 8,
	},
	rowTitle: {
		fontSize: 14,
		fontWeight: "800",
		color: "#fff",
		marginBottom: 4,
	},
	rowDescription: {
		fontSize: 12,
		fontWeight: "600",
		color: "rgba(255,255,255,0.55)",
	},
});
