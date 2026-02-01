import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

const ITEMS = Array.from({ length: 30 }, (_, i) => ({
	id: i + 1,
	title: `Setting ${i + 1}`,
	description: `Scroll through to test boundary behavior`,
}));

/**
 * Settings index — the key test screen.
 *
 * This screen has a Transition.ScrollView that must coordinate with
 * TWO gesture owners on the same vertical axis:
 *
 *   - Outer stack (vertical): swipe ↓ at top boundary (scrollY = 0)
 *   - Settings stack (vertical-inverted): swipe ↑ at bottom boundary (scrollY = maxY)
 *
 * Before the fix, the ScrollView would only propagate to the nearest
 * same-axis owner (settings, vertical-inverted) and miss the outer
 * stack's vertical claim entirely.
 */
export default function SettingsIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["bottom"]}>
			<ScreenHeader
				title="Settings"
				subtitle="Slides from top · vertical-inverted"
			/>

			<View style={styles.instructionBox}>
				<Text style={styles.instructionTitle}>Two Boundaries, Two Owners</Text>
				<Text style={styles.instructionText}>
					1. At top (scrollY = 0) → Swipe ↓ dismisses outer stack{"\n"}
					2. Scroll to bottom (scrollY = maxY) → Swipe ↑ dismisses settings
					{"\n"}
					3. Mid-scroll → ScrollView handles gesture
				</Text>
			</View>

			<Transition.ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
			>
				<View style={styles.topBoundary}>
					<Text style={[styles.boundaryText, { color: "#4caf50" }]}>
						← Top boundary (scrollY = 0)
					</Text>
				</View>

				{ITEMS.map((item) => (
					<View key={item.id} style={styles.item}>
						<Text style={styles.itemTitle}>{item.title}</Text>
						<Text style={styles.itemDescription}>{item.description}</Text>
					</View>
				))}

				<View style={styles.bottomBoundary}>
					<Text style={[styles.boundaryText, { color: "#ff9e4a" }]}>
						← Bottom boundary (scrollY = maxY)
					</Text>
					<Text style={styles.boundarySubtext}>
						Swipe ↑ here dismisses the settings stack (vertical-inverted owner)
					</Text>
				</View>
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#2e1a3e",
	},
	instructionBox: {
		margin: 16,
		marginBottom: 0,
		backgroundColor: "rgba(168, 85, 247, 0.1)",
		borderRadius: 12,
		padding: 12,
		borderWidth: 1,
		borderColor: "rgba(168, 85, 247, 0.3)",
	},
	instructionTitle: {
		fontSize: 12,
		fontWeight: "600",
		color: "#a855f7",
		marginBottom: 4,
	},
	instructionText: {
		fontSize: 12,
		color: "rgba(255, 255, 255, 0.8)",
		lineHeight: 18,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		gap: 8,
	},
	topBoundary: {
		backgroundColor: "rgba(76, 175, 80, 0.2)",
		borderRadius: 12,
		padding: 16,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: "rgba(76, 175, 80, 0.5)",
	},
	bottomBoundary: {
		backgroundColor: "rgba(255, 158, 74, 0.2)",
		borderRadius: 12,
		padding: 16,
		marginTop: 8,
		borderWidth: 1,
		borderColor: "rgba(255, 158, 74, 0.5)",
	},
	boundaryText: {
		fontSize: 14,
		fontWeight: "600",
	},
	boundarySubtext: {
		fontSize: 12,
		color: "rgba(255, 255, 255, 0.6)",
		marginTop: 4,
	},
	item: {
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		padding: 16,
		borderRadius: 12,
	},
	itemTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 4,
	},
	itemDescription: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.6)",
	},
});
