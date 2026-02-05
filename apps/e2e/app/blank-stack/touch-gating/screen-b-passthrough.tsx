import { router } from "expo-router";
import { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.5;

export default function TouchGatingScreenBPassthrough() {
	const [tapCount, setTapCount] = useState(0);

	return (
		<View style={styles.container} pointerEvents="box-none">
			<View style={styles.spacer} pointerEvents="box-none" />
			<Pressable style={styles.sheet} onPress={() => setTapCount((c) => c + 1)}>
				<View style={styles.handle} />

				<View style={styles.header}>
					<Text style={styles.title}>Screen B</Text>
					<Text style={styles.subtitle}>Passthrough enabled</Text>
				</View>

				<View style={styles.counterContainer}>
					<Text style={styles.counterLabel}>Screen B Taps</Text>
					<Text style={styles.counterValue}>{tapCount}</Text>
				</View>

				<Text style={styles.instructions}>
					Tap on this sheet to increment this counter.{"\n"}
					Tap ABOVE this sheet (on Screen A) - those taps go to A!
				</Text>

				<View style={styles.infoBox}>
					<Text style={styles.infoTitle}>Touch Gating: PASSTHROUGH</Text>
					<Text style={styles.infoText}>
						Screen A below IS receiving touches in the area not covered by this
						sheet.
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
	spacer: {
		flex: 1,
	},
	sheet: {
		height: SHEET_HEIGHT,
		backgroundColor: "#1a2e1a",
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
		marginBottom: 16,
	},
	header: {
		alignItems: "center",
		marginBottom: 16,
	},
	title: {
		fontSize: 22,
		fontWeight: "bold",
		color: "#fff",
	},
	subtitle: {
		fontSize: 13,
		color: "#888",
		marginTop: 4,
	},
	counterContainer: {
		alignItems: "center",
		marginBottom: 16,
	},
	counterLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: "#888",
		marginBottom: 4,
	},
	counterValue: {
		fontSize: 48,
		fontWeight: "bold",
		color: "#9C27B0",
	},
	instructions: {
		fontSize: 13,
		color: "#666",
		textAlign: "center",
		lineHeight: 18,
		marginBottom: 12,
	},
	infoBox: {
		padding: 12,
		backgroundColor: "rgba(156, 39, 176, 0.1)",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(156, 39, 176, 0.3)",
		marginBottom: 12,
	},
	infoTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: "#9C27B0",
		marginBottom: 4,
	},
	infoText: {
		fontSize: 12,
		color: "#888",
	},
	buttonContainer: {
		marginBottom: 12,
	},
	button: {
		backgroundColor: "#333",
		padding: 14,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonText: {
		color: "#fff",
		fontSize: 15,
		fontWeight: "600",
	},
	hint: {
		fontSize: 11,
		color: "rgba(255,255,255,0.3)",
		textAlign: "center",
	},
});
