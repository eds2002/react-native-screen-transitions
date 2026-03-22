import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

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
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["bottom"]}
		>
			<ScreenHeader
				title="Settings"
				subtitle="Slides from top · vertical-inverted"
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
				<View
					style={[
						styles.topBoundary,
						{ backgroundColor: theme.noteBox },
					]}
				>
					<Text style={[styles.boundaryText, { color: theme.noteText }]}>
						← Top boundary (scrollY = 0)
					</Text>
				</View>

				{ITEMS.map((item) => (
					<View
						key={item.id}
						style={[styles.item, { backgroundColor: theme.card }]}
					>
						<Text style={[styles.itemTitle, { color: theme.text }]}>
							{item.title}
						</Text>
						<Text
							style={[
								styles.itemDescription,
								{ color: theme.textSecondary },
							]}
						>
							{item.description}
						</Text>
					</View>
				))}

				<View
					style={[
						styles.bottomBoundary,
						{ backgroundColor: theme.noteBox },
					]}
				>
					<Text style={[styles.boundaryText, { color: theme.noteText }]}>
						← Bottom boundary (scrollY = maxY)
					</Text>
					<Text
						style={[
							styles.boundarySubtext,
							{ color: theme.textSecondary },
						]}
					>
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
		padding: 16,
		gap: 8,
	},
	topBoundary: {
		borderRadius: 14,
		padding: 16,
		marginBottom: 8,
	},
	bottomBoundary: {
		borderRadius: 14,
		padding: 16,
		marginTop: 8,
	},
	boundaryText: {
		fontSize: 14,
		fontWeight: "600",
	},
	boundarySubtext: {
		fontSize: 12,
		marginTop: 4,
	},
	item: {
		padding: 16,
		borderRadius: 14,
	},
	itemTitle: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 4,
	},
	itemDescription: {
		fontSize: 13,
	},
});
