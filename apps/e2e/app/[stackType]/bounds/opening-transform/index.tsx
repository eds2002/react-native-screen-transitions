import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import { OPENING_TRANSFORM_BOUNDARY_ID } from "./constants";

export default function OpeningTransformBoundsIndex() {
	const stackType = useResolvedStackType();
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Opening Transform Probe"
				subtitle="Destination content starts translated and scaled before open progress begins."
			/>

			<View style={styles.content}>
				<View style={[styles.noteCard, { backgroundColor: theme.noteBox }]}>
					<Text style={[styles.noteTitle, { color: theme.noteText }]}>
						What this reproduces
					</Text>
					<Text style={[styles.noteBody, { color: theme.textSecondary }]}>
						The destination screen intentionally opens with a strong content
						transform. If the destination boundary is measured before those
						styles are suppressed, the stored destination measurement will
						differ from the final settled layout.
					</Text>
				</View>

				<View style={styles.arena}>
					<View
						pointerEvents="none"
						style={[
							styles.ghost,
							{
								borderColor: theme.separator,
								backgroundColor: theme.card,
							},
						]}
					>
						<Text style={[styles.ghostLabel, { color: theme.textTertiary }]}>
							Final destination layout
						</Text>
					</View>

					<Transition.Boundary.Trigger
						id={OPENING_TRANSFORM_BOUNDARY_ID}
						testID="opening-transform-open"
						style={[
							styles.triggerCard,
							{ backgroundColor: theme.actionButton },
						]}
						onPress={() =>
							router.push(
								buildStackPath(
									stackType,
									"bounds/opening-transform/destination",
								) as never,
							)
						}
					>
						<Text
							style={[styles.triggerLabel, { color: theme.actionButtonText }]}
						>
							Open destination probe
						</Text>
						<Text
							style={[styles.triggerHint, { color: theme.actionButtonText }]}
						>
							Shared boundary source
						</Text>
					</Transition.Boundary.Trigger>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		paddingBottom: 24,
		gap: 16,
	},
	noteCard: {
		padding: 14,
		borderRadius: 14,
	},
	noteTitle: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.8,
	},
	noteBody: {
		marginTop: 6,
		fontSize: 13,
		lineHeight: 20,
	},
	arena: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	ghost: {
		position: "absolute",
		top: 120,
		width: 280,
		height: 180,
		borderRadius: 24,
		borderWidth: 2,
		borderStyle: "dashed",
		alignItems: "center",
		justifyContent: "center",
	},
	ghostLabel: {
		fontSize: 13,
		fontWeight: "600",
	},
	triggerCard: {
		width: 176,
		height: 112,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	triggerLabel: {
		fontSize: 16,
		fontWeight: "700",
		textAlign: "center",
	},
	triggerHint: {
		marginTop: 8,
		fontSize: 12,
		fontWeight: "600",
		opacity: 0.84,
	},
});
