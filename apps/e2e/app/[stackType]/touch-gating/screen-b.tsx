import { router } from "expo-router";
import { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function TouchGatingScreenB() {
	const [tapCount, setTapCount] = useState(0);

	return (
		<View style={styles.container}>
			<Pressable style={styles.sheet} onPress={() => setTapCount((c) => c + 1)}>
				<View style={styles.handle} />

				<View style={styles.header}>
					<Text style={styles.title}>Screen B</Text>
					<Text style={styles.subtitle}>Touches are blocked below</Text>
				</View>

				<View style={styles.counterContainer}>
					<Text style={styles.counterLabel}>Screen B Taps</Text>
					<Text style={styles.counterValue}>{tapCount}</Text>
				</View>

				<Text style={styles.instructions}>
					Tap anywhere on this sheet to increment the counter.{"\n"}
					Try tapping where Screen A would be - it should NOT count.
				</Text>

				<View style={styles.infoBox}>
					<Text style={styles.infoTitle}>Touch Gating: BLOCK</Text>
					<Text style={styles.infoText}>
						Screen A below is NOT receiving touches while this screen is open.
					</Text>
				</View>

				<View style={styles.buttonContainer}>
					<Pressable style={styles.button} onPress={() => router.back()}>
						<Text style={styles.buttonText}>Go Back</Text>
					</Pressable>
				</View>

				<Text style={styles.hint}>Swipe down to dismiss</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	sheet: {
		flex: 1,
		backgroundColor: "#1a1a2e",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		paddingHorizontal: 20,
		paddingTop: 10,
	},
	handle: {
		width: 44,
		height: 5,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 3,
		alignSelf: "center",
		marginBottom: 20,
	},
	header: {
		alignItems: "center",
		marginBottom: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#fff",
	},
	subtitle: {
		fontSize: 14,
		color: "#888",
		marginTop: 4,
	},
	counterContainer: {
		alignItems: "center",
		marginBottom: 24,
	},
	counterLabel: {
		fontSize: 16,
		fontWeight: "600",
		color: "#888",
		marginBottom: 8,
	},
	counterValue: {
		fontSize: 64,
		fontWeight: "bold",
		color: "#2196F3",
	},
	instructions: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
		lineHeight: 20,
		marginBottom: 20,
	},
	infoBox: {
		padding: 16,
		backgroundColor: "rgba(33, 150, 243, 0.1)",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(33, 150, 243, 0.3)",
		marginBottom: 20,
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#2196F3",
		marginBottom: 4,
	},
	infoText: {
		fontSize: 13,
		color: "#888",
	},
	buttonContainer: {
		marginBottom: 20,
	},
	button: {
		backgroundColor: "#333",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	hint: {
		fontSize: 12,
		color: "rgba(255,255,255,0.3)",
		textAlign: "center",
	},
});
