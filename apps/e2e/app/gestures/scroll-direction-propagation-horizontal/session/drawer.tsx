import { useWindowDimensions, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

const PANELS = Array.from({ length: 8 }, (_, i) => ({
	id: i + 1,
	title: `Panel ${i + 1}`,
	description: "Swipe horizontally to test ownership handoff",
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
	const theme = useTheme();
	const { width } = useWindowDimensions();
	const panelWidth = Math.max(240, width - 72);

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["bottom"]}
		>
			<ScreenHeader
				title="Horizontal Drawer"
				subtitle="Slides from left · horizontal-inverted"
			/>

			<View
				style={[
					styles.instructionBox,
					{ backgroundColor: theme.infoBox },
				]}
			>
				<Text style={[styles.instructionTitle, { color: theme.text }]}>
					Two Boundaries, Two Owners
				</Text>
				<Text
					style={[styles.instructionText, { color: theme.textSecondary }]}
				>
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
								backgroundColor: theme.card,
							},
						]}
					>
						<Text style={[styles.panelTitle, { color: theme.text }]}>
							{panel.title}
						</Text>
						<Text
							style={[
								styles.panelDescription,
								{ color: theme.textSecondary },
							]}
						>
							{panel.description}
						</Text>

						{index === 0 ? (
							<View
								style={[
									styles.boundaryBox,
									{ backgroundColor: theme.noteBox },
								]}
							>
								<Text
									style={[styles.boundaryText, { color: theme.noteText }]}
								>
									Left boundary (scrollX = 0)
								</Text>
								<Text
									style={[
										styles.boundarySubtext,
										{ color: theme.textSecondary },
									]}
								>
									Swipe → here dismisses the session route
								</Text>
							</View>
						) : null}

						{index === PANELS.length - 1 ? (
							<View
								style={[
									styles.boundaryBox,
									{ backgroundColor: theme.noteBox },
								]}
							>
								<Text
									style={[styles.boundaryText, { color: theme.noteText }]}
								>
									Right boundary (scrollX = maxX)
								</Text>
								<Text
									style={[
										styles.boundarySubtext,
										{ color: theme.textSecondary },
									]}
								>
									Swipe ← here dismisses the drawer route
								</Text>
							</View>
						) : (
							<View
								style={[
									styles.midBox,
									{ backgroundColor: theme.surfaceElevated },
								]}
							>
								<Text
									style={[
										styles.midBoxText,
										{ color: theme.textTertiary },
									]}
								>
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
	},
	instructionBox: {
		margin: 16,
		marginBottom: 0,
		borderRadius: 14,
		padding: 12,
	},
	instructionTitle: {
		fontSize: 12,
		fontWeight: "600",
		marginBottom: 4,
	},
	instructionText: {
		fontSize: 12,
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
	},
	panelTitle: {
		fontSize: 22,
		fontWeight: "700",
		marginBottom: 8,
	},
	panelDescription: {
		fontSize: 14,
		lineHeight: 20,
	},
	boundaryBox: {
		marginTop: 24,
		borderRadius: 14,
		padding: 16,
	},
	midBox: {
		marginTop: 24,
		borderRadius: 14,
		padding: 16,
	},
	midBoxText: {
		fontSize: 13,
		lineHeight: 18,
	},
	boundaryText: {
		fontSize: 14,
		fontWeight: "600",
	},
	boundarySubtext: {
		fontSize: 12,
		marginTop: 4,
		lineHeight: 18,
	},
});
