import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { buildStackPath, useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

export default function TouchGatingScreenA() {
	const stackType = useResolvedStackType();
	const [tapCount, setTapCount] = useState(0);
	const theme = useTheme();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={["top"]}>
			<ScreenHeader
				title="Screen A"
				subtitle="Touch gating demo - tap anywhere to count"
			/>

			<Pressable
				style={styles.tapArea}
				onPress={() => setTapCount((c) => c + 1)}
			>
				<View style={styles.counterContainer}>
					<Text style={[styles.counterLabel, { color: theme.textSecondary }]}>
						Screen A Taps
					</Text>
					<Text style={[styles.counterValue, { color: theme.text }]}>
						{tapCount}
					</Text>
				</View>

				<Text style={[styles.instructions, { color: theme.textTertiary }]}>
					Tap anywhere on this screen to increment the counter
				</Text>
			</Pressable>

			<View style={styles.buttonContainer}>
				<Pressable
					style={({ pressed }) => [
						styles.button,
						{ backgroundColor: pressed ? theme.actionButtonPressed : theme.actionButton },
					]}
					onPress={() => router.push(buildStackPath(stackType, "touch-gating/screen-b"))}
				>
					<Text style={[styles.buttonText, { color: theme.actionButtonText }]}>
						Open Screen B (blocks touches)
					</Text>
				</Pressable>

				<Pressable
					style={({ pressed }) => [
						styles.button,
						{ backgroundColor: pressed ? theme.secondaryButtonPressed : theme.secondaryButton },
					]}
					onPress={() =>
						router.push(buildStackPath(stackType, "touch-gating/screen-b-passthrough"))
					}
				>
					<Text style={[styles.secondaryButtonText, { color: theme.secondaryButtonText }]}>
						Open Screen B (passthrough touches)
					</Text>
				</Pressable>
			</View>

			<View style={[styles.infoBox, { backgroundColor: theme.card }]}>
				<Text style={[styles.infoTitle, { color: theme.text }]}>Expected behavior:</Text>
				<Text style={[styles.infoText, { color: theme.textSecondary }]}>
					{"\u2022"} When B opens, A should stop receiving taps immediately
				</Text>
				<Text style={[styles.infoText, { color: theme.textSecondary }]}>
					{"\u2022"} When B closes (swipe down), A should start receiving taps
					right away
				</Text>
				<Text style={[styles.infoText, { color: theme.textSecondary }]}>
					{"\u2022"} With passthrough, A receives taps even while B is open
				</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	tapArea: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	counterContainer: {
		alignItems: "center",
		marginBottom: 24,
	},
	counterLabel: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 8,
	},
	counterValue: {
		fontSize: 72,
		fontWeight: "bold",
	},
	instructions: {
		fontSize: 14,
		textAlign: "center",
	},
	buttonContainer: {
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
	secondaryButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
	infoBox: {
		margin: 16,
		marginTop: 0,
		padding: 16,
		borderRadius: 14,
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: "700",
		marginBottom: 8,
	},
	infoText: {
		fontSize: 13,
		marginBottom: 4,
	},
});
