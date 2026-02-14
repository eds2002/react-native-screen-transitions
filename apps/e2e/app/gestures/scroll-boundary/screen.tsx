import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

const ITEMS = Array.from({ length: 30 }, (_, i) => ({
	id: i + 1,
	title: `Item ${i + 1}`,
	description: `Scroll to this item and try to dismiss`,
}));

/**
 * Screen with ScrollView demonstrating boundary behavior.
 *
 * Test:
 * 1. When scrolled to top (scrollY = 0): swipe down dismisses
 * 2. When scrolled mid-list (scrollY > 0): swipe down scrolls up
 * 3. Scroll to top, THEN swipe down: dismisses
 */
export default function ScreenWithScroll() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="ScrollView Boundary Test"
				subtitle="Try dismissing at different scroll positions"
			/>

			<View style={styles.instructionBox}>
				<Text style={styles.instructionTitle}>Test Instructions</Text>
				<Text style={styles.instructionText}>
					1. At top → Swipe down dismisses{"\n"}
					2. Scroll down, then swipe down → ScrollView scrolls up{"\n"}
					3. Return to top, then swipe down → Dismisses
				</Text>
			</View>

			<Transition.ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
			>
				<View style={styles.boundaryIndicator}>
					<Text style={styles.boundaryText}>
						← You are at the boundary (scrollY = 0)
					</Text>
					<Text style={styles.boundarySubtext}>
						Swipe down from here to dismiss
					</Text>
				</View>

				{ITEMS.map((item) => (
					<View key={item.id} style={styles.item}>
						<Text style={styles.itemTitle}>{item.title}</Text>
						<Text style={styles.itemDescription}>{item.description}</Text>
					</View>
				))}
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a2e4e",
	},
	instructionBox: {
		margin: 16,
		marginBottom: 0,
		backgroundColor: "rgba(74, 158, 255, 0.1)",
		borderRadius: 12,
		padding: 12,
		borderWidth: 1,
		borderColor: "rgba(74, 158, 255, 0.3)",
	},
	instructionTitle: {
		fontSize: 12,
		fontWeight: "600",
		color: "#4a9eff",
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
	boundaryIndicator: {
		backgroundColor: "rgba(76, 175, 80, 0.2)",
		borderRadius: 12,
		padding: 16,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: "rgba(76, 175, 80, 0.5)",
	},
	boundaryText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#4caf50",
	},
	boundarySubtext: {
		fontSize: 12,
		color: "rgba(76, 175, 80, 0.8)",
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
