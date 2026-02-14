import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

export default function TouchGatingScreenA() {
	const [tapCount, setTapCount] = useState(0);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Screen A"
				subtitle="Touch gating demo - tap anywhere to count"
			/>

			<Pressable
				style={styles.tapArea}
				onPress={() => setTapCount((c) => c + 1)}
			>
				<View style={styles.counterContainer}>
					<Text style={styles.counterLabel}>Screen A Taps</Text>
					<Text style={styles.counterValue}>{tapCount}</Text>
				</View>

				<Text style={styles.instructions}>
					Tap anywhere on this screen to increment the counter
				</Text>
			</Pressable>

			<View style={styles.buttonContainer}>
				<Pressable
					style={styles.button}
					onPress={() => router.push("/blank-stack/touch-gating/screen-b")}
				>
					<Text style={styles.buttonText}>Open Screen B (blocks touches)</Text>
				</Pressable>

				<Pressable
					style={[styles.button, styles.buttonSecondary]}
					onPress={() =>
						router.push("/blank-stack/touch-gating/screen-b-passthrough")
					}
				>
					<Text style={styles.buttonText}>
						Open Screen B (passthrough touches)
					</Text>
				</Pressable>
			</View>

			<View style={styles.infoBox}>
				<Text style={styles.infoTitle}>Expected behavior:</Text>
				<Text style={styles.infoText}>
					{"\u2022"} When B opens, A should stop receiving taps immediately
				</Text>
				<Text style={styles.infoText}>
					{"\u2022"} When B closes (swipe down), A should start receiving taps
					right away
				</Text>
				<Text style={styles.infoText}>
					{"\u2022"} With passthrough, A receives taps even while B is open
				</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
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
		color: "#888",
		marginBottom: 8,
	},
	counterValue: {
		fontSize: 72,
		fontWeight: "bold",
		color: "#4CAF50",
	},
	instructions: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
	},
	buttonContainer: {
		padding: 16,
		gap: 12,
	},
	button: {
		backgroundColor: "#2196F3",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonSecondary: {
		backgroundColor: "#9C27B0",
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	infoBox: {
		margin: 16,
		marginTop: 0,
		padding: 16,
		backgroundColor: "#1e1e1e",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#333",
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fff",
		marginBottom: 8,
	},
	infoText: {
		fontSize: 13,
		color: "#888",
		marginBottom: 4,
	},
});
