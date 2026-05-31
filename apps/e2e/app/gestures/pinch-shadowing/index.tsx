import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function PinchShadowingIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Pinch Shadowing Probe"
				subtitle="Observe raw nested pinch behavior before formal pinch ownership"
			/>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<GestureInfo
					title="How to read this scenario"
					structure={`gestures/pinch-shadowing/        (pinch-in + pinch-out)
  ├─ inherit                        (none)
  ├─ child-pinch                    (pinch-in + pinch-out)
  └─ child-vertical                 (vertical)`}
					behaviors={[
						{
							direction: "pinch",
							owner: "Parent or child",
							result: "Use the return destination to see who won",
						},
					]}
					note="This is intentionally exploratory. If a pinch returns you to the gestures home screen, the parent pinch won. If it returns you to this probe index, the child screen won."
				/>

				<View style={styles.probeGrid}>
					<View style={[styles.probeCard, { backgroundColor: theme.card }]}>
						<Text style={[styles.probeTitle, { color: theme.text }]}>
							Inherit
						</Text>
						<Text style={[styles.probeText, { color: theme.textSecondary }]}>
							Child has no gesture config. Pinch in or out to see whether the
							parent pinch dismisses the whole probe stack.
						</Text>
					</View>

					<View style={[styles.probeCard, { backgroundColor: theme.card }]}>
						<Text style={[styles.probeTitle, { color: theme.text }]}>
							Child Pinch
						</Text>
						<Text style={[styles.probeText, { color: theme.textSecondary }]}>
							Child uses the same pinch directions as the parent. If the child
							wins, pinch returns here instead of leaving the probe entirely.
						</Text>
					</View>

					<View style={[styles.probeCard, { backgroundColor: theme.card }]}>
						<Text style={[styles.probeTitle, { color: theme.text }]}>
							Child Vertical
						</Text>
						<Text style={[styles.probeText, { color: theme.textSecondary }]}>
							Child only owns vertical pan. Pinch should reveal whether the
							parent pinch survives when the child uses a different gesture
							family.
						</Text>
					</View>
				</View>

				<View style={styles.actions}>
					<Pressable
						testID="gesture-pinch-shadowing-inherit"
						style={({ pressed }) => [
							styles.button,
							{
								backgroundColor: pressed
									? theme.actionButtonPressed
									: theme.actionButton,
							},
						]}
						onPress={() => router.push("/gestures/pinch-shadowing/inherit")}
					>
						<Text
							style={[styles.buttonText, { color: theme.actionButtonText }]}
						>
							Open Inherit Leaf
						</Text>
						<Text
							style={[
								styles.buttonSubtext,
								{ color: theme.actionButtonText, opacity: 0.72 },
							]}
						>
							No child gesture config
						</Text>
					</Pressable>

					<Pressable
						testID="gesture-pinch-shadowing-child-pinch"
						style={({ pressed }) => [
							styles.button,
							{
								backgroundColor: pressed
									? theme.secondaryButtonPressed
									: theme.secondaryButton,
							},
						]}
						onPress={() => router.push("/gestures/pinch-shadowing/child-pinch")}
					>
						<Text
							style={[styles.buttonText, { color: theme.secondaryButtonText }]}
						>
							Open Child Pinch Leaf
						</Text>
						<Text
							style={[
								styles.buttonSubtext,
								{ color: theme.secondaryButtonText, opacity: 0.72 },
							]}
						>
							Same pinch directions as parent
						</Text>
					</Pressable>

					<Pressable
						testID="gesture-pinch-shadowing-child-vertical"
						style={({ pressed }) => [
							styles.button,
							{
								backgroundColor: pressed
									? theme.secondaryButtonPressed
									: theme.secondaryButton,
							},
						]}
						onPress={() =>
							router.push("/gestures/pinch-shadowing/child-vertical")
						}
					>
						<Text
							style={[styles.buttonText, { color: theme.secondaryButtonText }]}
						>
							Open Child Vertical Leaf
						</Text>
						<Text
							style={[
								styles.buttonSubtext,
								{ color: theme.secondaryButtonText, opacity: 0.72 },
							]}
						>
							Vertical child with parent pinch
						</Text>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 40,
	},
	probeGrid: {
		paddingHorizontal: 16,
		gap: 12,
	},
	probeCard: {
		padding: 16,
		borderRadius: 14,
	},
	probeTitle: {
		fontSize: 15,
		fontWeight: "600",
		marginBottom: 8,
	},
	probeText: {
		fontSize: 13,
		lineHeight: 20,
	},
	actions: {
		padding: 16,
		gap: 12,
	},
	button: {
		padding: 16,
		borderRadius: 999,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
	},
	buttonSubtext: {
		fontSize: 12,
		marginTop: 4,
	},
});
