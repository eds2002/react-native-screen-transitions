import { useWindowDimensions, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

const PANELS = Array.from({ length: 8 }, (_, i) => ({
	id: i + 1,
	title: `Panel ${i + 1}`,
	description: "Swipe horizontally to test ownership handoff",
	color:
		i % 4 === 0
			? "rgba(74, 158, 255, 0.16)"
			: i % 4 === 1
				? "rgba(255, 158, 74, 0.16)"
				: i % 4 === 2
					? "rgba(76, 175, 80, 0.16)"
					: "rgba(168, 85, 247, 0.16)",
}));

/**
 * Drawer screen — the key horizontal handoff screen.
 *
 * This screen has a horizontal Transition.ScrollView that must coordinate with:
 *   - Session route (horizontal): swipe → at left boundary (scrollX = 0)
 *   - Drawer route (horizontal-inverted): swipe ← at right boundary (scrollX = maxX)
 *
 * Mid-scroll, the ScrollView should keep ownership.
 */
export default function HorizontalDrawerScreen() {
	const { width } = useWindowDimensions();
	const panelWidth = Math.max(240, width - 72);

	return (
		<SafeAreaView style={styles.container} edges={["bottom"]}>
			<ScreenHeader
				title="Horizontal Drawer"
				subtitle="Slides from left · horizontal-inverted"
			/>

			<View style={styles.instructionBox}>
				<Text style={styles.instructionTitle}>Two Boundaries, Two Owners</Text>
				<Text style={styles.instructionText}>
					1. At left edge (scrollX = 0) → Swipe → dismisses session{"\n"}
					2. At right edge (scrollX = maxX) → Swipe ← dismisses drawer{"\n"}
					3. Mid-scroll → ScrollView handles gesture
				</Text>
			</View>

			<Transition.ScrollView
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				decelerationRate="fast"
			>
				{PANELS.map((panel, index) => (
					<View
						key={panel.id}
						style={[
							styles.panel,
							{
								width: panelWidth,
								marginLeft: index === 0 ? 16 : 0,
								marginRight: index === PANELS.length - 1 ? 16 : 0,
								backgroundColor: panel.color,
							},
						]}
					>
						<Text style={styles.panelTitle}>{panel.title}</Text>
						<Text style={styles.panelDescription}>{panel.description}</Text>

						{index === 0 ? (
							<View style={styles.boundaryBoxLeft}>
								<Text style={[styles.boundaryText, { color: "#4caf50" }]}>
									Left boundary (scrollX = 0)
								</Text>
								<Text style={styles.boundarySubtext}>
									Swipe → here dismisses the session route
								</Text>
							</View>
						) : null}

						{index === PANELS.length - 1 ? (
							<View style={styles.boundaryBoxRight}>
								<Text style={[styles.boundaryText, { color: "#ff9e4a" }]}>
									Right boundary (scrollX = maxX)
								</Text>
								<Text style={styles.boundarySubtext}>
									Swipe ← here dismisses the drawer route
								</Text>
							</View>
						) : (
							<View style={styles.midBox}>
								<Text style={styles.midBoxText}>
									Mid-scroll panels should keep horizontal ownership
								</Text>
							</View>
						)}
					</View>
				))}
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#241733",
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
		alignItems: "stretch",
		paddingVertical: 16,
		gap: 16,
	},
	panel: {
		borderRadius: 20,
		padding: 20,
		justifyContent: "space-between",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.08)",
	},
	panelTitle: {
		fontSize: 22,
		fontWeight: "700",
		color: "#fff",
		marginBottom: 8,
	},
	panelDescription: {
		fontSize: 14,
		color: "rgba(255, 255, 255, 0.72)",
		lineHeight: 20,
	},
	boundaryBoxLeft: {
		marginTop: 24,
		backgroundColor: "rgba(76, 175, 80, 0.14)",
		borderRadius: 14,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(76, 175, 80, 0.35)",
	},
	boundaryBoxRight: {
		marginTop: 24,
		backgroundColor: "rgba(255, 158, 74, 0.14)",
		borderRadius: 14,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 158, 74, 0.35)",
	},
	midBox: {
		marginTop: 24,
		backgroundColor: "rgba(255, 255, 255, 0.06)",
		borderRadius: 14,
		padding: 16,
	},
	midBoxText: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.65)",
		lineHeight: 18,
	},
	boundaryText: {
		fontSize: 14,
		fontWeight: "600",
	},
	boundarySubtext: {
		fontSize: 12,
		color: "rgba(255, 255, 255, 0.62)",
		marginTop: 4,
		lineHeight: 18,
	},
});
