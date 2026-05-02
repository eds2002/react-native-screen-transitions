import { router } from "expo-router";
import { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function SnapLockedNoBubbleSheet() {
	const theme = useTheme();
	const [probeTaps, setProbeTaps] = useState(0);

	return (
		<View
			testID="snap-locked-no-bubble-sheet"
			style={[
				styles.container,
				{ maxHeight: SCREEN_HEIGHT, backgroundColor: theme.card },
			]}
		>
			<View style={[styles.handle, { backgroundColor: theme.handle }]} />
			<Text style={[styles.title, { color: theme.text }]}>
				Locked + No Dismiss
			</Text>
			<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
				This sheet owns the vertical axis but cannot move or dismiss.
			</Text>

			<View style={[styles.card, { backgroundColor: theme.surfaceElevated }]}>
				<Text style={[styles.cardTitle, { color: theme.textTertiary }]}>
					Manual verification
				</Text>
				<Text style={[styles.cardLine, { color: theme.textSecondary }]}>
					- Swipe down repeatedly on this sheet.
				</Text>
				<Text style={[styles.cardLine, { color: theme.textSecondary }]}>
					- Parent route should NOT dismiss.
				</Text>
				<Text style={[styles.cardLine, { color: theme.textSecondary }]}>
					- Swipe up should also do nothing.
				</Text>
			</View>

			<Pressable
				testID="snap-locked-no-bubble-probe"
				style={({ pressed }) => [
					styles.probeButton,
					{
						backgroundColor: pressed
							? theme.secondaryButtonPressed
							: theme.secondaryButton,
					},
				]}
				onPress={() => setProbeTaps((count) => count + 1)}
			>
				<Text style={[styles.probeTitle, { color: theme.secondaryButtonText }]}>
					Interaction Probe
				</Text>
				<Text style={[styles.probeCount, { color: theme.text }]}>
					Taps: {probeTaps}
				</Text>
			</Pressable>

			<Pressable
				testID="snap-locked-no-bubble-back"
				style={({ pressed }) => [
					styles.backButton,
					{
						backgroundColor: pressed
							? theme.secondaryButtonPressed
							: theme.secondaryButton,
					},
				]}
				onPress={() => router.back()}
			>
				<Text style={[styles.backText, { color: theme.secondaryButtonText }]}>
					Back
				</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 12,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
	},
	handle: {
		alignSelf: "center",
		width: 44,
		height: 5,
		borderRadius: 3,
		marginBottom: 16,
	},
	title: {
		fontSize: 28,
		fontWeight: "900",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 13,
		fontWeight: "600",
		marginBottom: 14,
	},
	card: {
		borderRadius: 14,
		padding: 12,
		marginBottom: 12,
	},
	cardTitle: {
		fontSize: 12,
		fontWeight: "800",
		marginBottom: 8,
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	cardLine: {
		fontSize: 12,
		fontWeight: "600",
		marginBottom: 4,
	},
	probeButton: {
		borderRadius: 14,
		paddingVertical: 14,
		paddingHorizontal: 14,
		marginBottom: 12,
	},
	probeTitle: {
		fontSize: 14,
		fontWeight: "800",
		marginBottom: 4,
	},
	probeCount: {
		fontSize: 13,
		fontWeight: "700",
	},
	backButton: {
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 11,
	},
	backText: {
		fontSize: 12,
		fontWeight: "800",
		textTransform: "uppercase",
		letterSpacing: 0.6,
	},
});
