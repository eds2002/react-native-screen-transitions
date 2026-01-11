import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function NormalScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Normal Stack</Text>
			<Text style={styles.description}>
				Standard horizontal slide pushed from the bottom sheet.
			</Text>

			<Pressable style={styles.button} onPress={() => router.back()}>
				<Text style={styles.buttonText}>Go Back</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#2d1b4e",
		padding: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 12,
	},
	description: {
		fontSize: 16,
		color: "rgba(255,255,255,0.7)",
		textAlign: "center",
		marginBottom: 40,
	},
	button: {
		backgroundColor: "rgba(255,255,255,0.2)",
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
		minWidth: 200,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},
});
