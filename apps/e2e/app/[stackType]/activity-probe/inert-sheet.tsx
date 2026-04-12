import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useActivityProbeStore } from "@/components/activity-probe/store";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

export default function ActivityProbeInertSheet() {
	const stackType = useResolvedStackType();
	const theme = useTheme();
	const heartbeatCount = useActivityProbeStore((state) => state.heartbeatCount);
	const pressCount = useActivityProbeStore((state) => state.pressCount);

	return (
		<SafeAreaView style={styles.container} edges={["bottom"]}>
			<View style={styles.scrim}>
				<View
					style={[styles.sheet, { backgroundColor: theme.surfaceElevated }]}
				>
					<Text style={[styles.title, { color: theme.text }]}>Inert sheet</Text>
					<Text style={[styles.body, { color: theme.textSecondary }]}>
						The screen underneath should stay mounted and keep its JS heartbeat
						running, but it should be inert to touch while this sheet is on top.
					</Text>

					<View style={styles.metricRow}>
						<View style={[styles.metric, { backgroundColor: theme.card }]}>
							<Text style={[styles.metricLabel, { color: theme.textTertiary }]}>
								Heartbeat
							</Text>
							<Text style={[styles.metricValue, { color: theme.text }]}>
								{heartbeatCount}
							</Text>
						</View>

						<View style={[styles.metric, { backgroundColor: theme.card }]}>
							<Text style={[styles.metricLabel, { color: theme.textTertiary }]}>
								Presses
							</Text>
							<Text style={[styles.metricValue, { color: theme.text }]}>
								{pressCount}
							</Text>
						</View>
					</View>

					<Text style={[styles.body, { color: theme.textSecondary }]}>
						Watch the heartbeat behind this sheet continue to move. Try tapping
						the background panel too; the count should not change.
					</Text>

					<Pressable
						testID="activity-probe-open-pause"
						style={({ pressed }) => [
							styles.button,
							{
								backgroundColor: pressed
									? theme.secondaryButtonPressed
									: theme.secondaryButton,
							},
						]}
						onPress={() =>
							router.push(
								buildStackPath(stackType, "activity-probe/pause-cover"),
							)
						}
					>
						<Text
							style={[styles.buttonText, { color: theme.secondaryButtonText }]}
						>
							Open pause layer
						</Text>
					</Pressable>

					<Pressable
						testID="activity-probe-close-inert"
						style={({ pressed }) => [
							styles.button,
							{
								backgroundColor: pressed
									? theme.actionButtonPressed
									: theme.actionButton,
							},
						]}
						onPress={() => router.back()}
					>
						<Text
							style={[styles.buttonText, { color: theme.actionButtonText }]}
						>
							Close sheet
						</Text>
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "transparent",
	},
	scrim: {
		flex: 1,
		justifyContent: "flex-end",
		padding: 16,
	},
	sheet: {
		borderRadius: 24,
		padding: 20,
		gap: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: "800",
	},
	body: {
		fontSize: 14,
		lineHeight: 20,
	},
	metricRow: {
		flexDirection: "row",
		gap: 12,
	},
	metric: {
		flex: 1,
		borderRadius: 14,
		padding: 14,
	},
	metricLabel: {
		fontSize: 12,
		fontWeight: "600",
		marginBottom: 6,
	},
	metricValue: {
		fontSize: 26,
		fontWeight: "800",
	},
	button: {
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "700",
	},
});
