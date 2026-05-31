import { StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

const ITEMS = Array.from({ length: 25 }, (_, i) => ({
	id: i + 1,
	title: `Location ${i + 1}`,
	distance: `${(Math.random() * 5).toFixed(1)} mi`,
}));

/**
 * Apple Maps-style sheet with sheetScrollGestureBehavior: "expand-and-collapse".
 *
 * When at scroll top:
 * - ↓ collapses sheet
 * - ↑ expands sheet
 *
 * When scrolled:
 * - ↓ ↑ scrolls the list
 */
export default function AppleMapsSheet() {
	const theme = useTheme();

	return (
		<View style={styles.container}>
			<View style={[styles.sheet, { backgroundColor: theme.card }]}>
				<View style={[styles.handle, { backgroundColor: theme.handle }]} />
				<ScreenHeader
					title="Apple Maps Style"
					subtitle='sheetScrollGestureBehavior: "expand-and-collapse"'
				/>

				<View style={styles.instructions}>
					<View style={styles.instructionRow}>
						<View style={[styles.badge, { backgroundColor: theme.activePill }]}>
							<Text style={[styles.badgeText, { color: theme.activePillText }]}>
								At Top
							</Text>
						</View>
						<Text
							style={[styles.instructionText, { color: theme.textSecondary }]}
						>
							↓ collapse, ↑ expand
						</Text>
					</View>
					<View style={styles.instructionRow}>
						<View style={[styles.badge, { backgroundColor: theme.pill }]}>
							<Text style={[styles.badgeText, { color: theme.pillText }]}>
								Scrolled
							</Text>
						</View>
						<Text
							style={[styles.instructionText, { color: theme.textSecondary }]}
						>
							↓ ↑ scroll list
						</Text>
					</View>
				</View>

				<Transition.ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
				>
					<View
						style={[styles.boundaryMarker, { backgroundColor: theme.noteBox }]}
					>
						<Text style={[styles.boundaryText, { color: theme.noteText }]}>
							Scroll Boundary (scrollY = 0)
						</Text>
						<Text
							style={[styles.boundarySubtext, { color: theme.textSecondary }]}
						>
							Swipe ↑ from here to expand, ↓ to collapse
						</Text>
					</View>

					{ITEMS.map((item) => (
						<View
							key={item.id}
							style={[styles.item, { backgroundColor: theme.surfaceElevated }]}
						>
							<View
								style={[styles.itemIcon, { backgroundColor: theme.surface }]}
							>
								<Text style={styles.itemIconText}>📍</Text>
							</View>
							<View style={styles.itemContent}>
								<Text style={[styles.itemTitle, { color: theme.text }]}>
									{item.title}
								</Text>
								<Text
									style={[styles.itemDistance, { color: theme.textTertiary }]}
								>
									{item.distance}
								</Text>
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
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingTop: 12,
		flex: 1,
	},
	handle: {
		width: 40,
		height: 4,
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
	badgeText: {
		fontSize: 10,
		fontWeight: "600",
	},
	instructionText: {
		fontSize: 12,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		gap: 8,
	},
	boundaryMarker: {
		borderRadius: 14,
		padding: 12,
		marginBottom: 8,
	},
	boundaryText: {
		fontSize: 13,
		fontWeight: "600",
	},
	boundarySubtext: {
		fontSize: 11,
		marginTop: 2,
	},
	item: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 14,
		gap: 12,
	},
	itemIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
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
	},
	itemDistance: {
		fontSize: 12,
		marginTop: 2,
	},
});
