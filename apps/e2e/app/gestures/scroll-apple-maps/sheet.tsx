import { StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

const ITEMS = Array.from({ length: 25 }, (_, i) => ({
	id: i + 1,
	title: `Location ${i + 1}`,
	distance: `${(Math.random() * 5).toFixed(1)} mi`,
}));

/**
 * Apple Maps-style sheet with expandViaScrollView: true.
 *
 * When at scroll top:
 * - ↓ collapses sheet
 * - ↑ expands sheet
 *
 * When scrolled:
 * - ↓ ↑ scrolls the list
 */
export default function AppleMapsSheet() {
	return (
		<View style={styles.container}>
			<View style={styles.sheet}>
				<View style={styles.handle} />
				<ScreenHeader
					title="Apple Maps Style"
					subtitle="expandViaScrollView: true"
				/>

				<View style={styles.instructions}>
					<View style={styles.instructionRow}>
						<View style={[styles.badge, styles.badgeGreen]}>
							<Text style={styles.badgeText}>At Top</Text>
						</View>
						<Text style={styles.instructionText}>↓ collapse, ↑ expand</Text>
					</View>
					<View style={styles.instructionRow}>
						<View style={[styles.badge, styles.badgeBlue]}>
							<Text style={styles.badgeText}>Scrolled</Text>
						</View>
						<Text style={styles.instructionText}>↓ ↑ scroll list</Text>
					</View>
				</View>

				<Transition.ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
				>
					<View style={styles.boundaryMarker}>
						<Text style={styles.boundaryText}>
							Scroll Boundary (scrollY = 0)
						</Text>
						<Text style={styles.boundarySubtext}>
							Swipe ↑ from here to expand, ↓ to collapse
						</Text>
					</View>

					{ITEMS.map((item) => (
						<View key={item.id} style={styles.item}>
							<View style={styles.itemIcon}>
								<Text style={styles.itemIconText}>📍</Text>
							</View>
							<View style={styles.itemContent}>
								<Text style={styles.itemTitle}>{item.title}</Text>
								<Text style={styles.itemDistance}>{item.distance}</Text>
							</View>
						</View>
					))}
				</Transition.ScrollView>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-end",
	},
	sheet: {
		backgroundColor: "#1b3a2e",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingTop: 12,
		flex: 1,
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		alignSelf: "center",
		marginBottom: 8,
	},
	instructions: {
		flexDirection: "row",
		gap: 16,
		paddingHorizontal: 16,
		paddingBottom: 12,
	},
	instructionRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	badge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
	},
	badgeGreen: {
		backgroundColor: "rgba(76, 175, 80, 0.3)",
	},
	badgeBlue: {
		backgroundColor: "rgba(74, 158, 255, 0.3)",
	},
	badgeText: {
		fontSize: 10,
		fontWeight: "600",
		color: "#fff",
	},
	instructionText: {
		fontSize: 12,
		color: "rgba(255, 255, 255, 0.6)",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		gap: 8,
	},
	boundaryMarker: {
		backgroundColor: "rgba(76, 175, 80, 0.2)",
		borderRadius: 12,
		padding: 12,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: "rgba(76, 175, 80, 0.5)",
	},
	boundaryText: {
		fontSize: 13,
		fontWeight: "600",
		color: "#4caf50",
	},
	boundarySubtext: {
		fontSize: 11,
		color: "rgba(76, 175, 80, 0.8)",
		marginTop: 2,
	},
	item: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		padding: 12,
		borderRadius: 12,
		gap: 12,
	},
	itemIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		justifyContent: "center",
		alignItems: "center",
	},
	itemIconText: {
		fontSize: 18,
	},
	itemContent: {
		flex: 1,
	},
	itemTitle: {
		fontSize: 15,
		fontWeight: "500",
		color: "#fff",
	},
	itemDistance: {
		fontSize: 12,
		color: "rgba(255, 255, 255, 0.5)",
		marginTop: 2,
	},
});
