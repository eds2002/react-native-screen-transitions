import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

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
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="ScrollView Boundary Test"
				subtitle="Try dismissing at different scroll positions"
			/>

			<View
				style={[
					styles.instructionBox,
					{ backgroundColor: theme.infoBox },
				]}
			>
				<Text style={[styles.instructionTitle, { color: theme.text }]}>
					Test Instructions
				</Text>
				<Text
					style={[styles.instructionText, { color: theme.textSecondary }]}
				>
					1. At top → Swipe down dismisses{"\n"}
					2. Scroll down, then swipe down → ScrollView scrolls up{"\n"}
					3. Return to top, then swipe down → Dismisses
				</Text>
			</View>

			<Transition.ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
			>
				<View
					style={[
						styles.boundaryIndicator,
						{ backgroundColor: theme.noteBox },
					]}
				>
					<Text
						style={[styles.boundaryText, { color: theme.noteText }]}
					>
						← You are at the boundary (scrollY = 0)
					</Text>
					<Text
						style={[
							styles.boundarySubtext,
							{ color: theme.textSecondary },
						]}
					>
						Swipe down from here to dismiss
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
	boundaryIndicator: {
		borderRadius: 14,
		padding: 16,
		marginBottom: 8,
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
