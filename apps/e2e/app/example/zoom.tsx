import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExampleZoom() {
	return (
		<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
			<View style={styles.hero}>
				<View style={styles.orbit}>
					<View style={styles.planet} />
				</View>
			</View>

			<View style={styles.content}>
				<Text style={styles.eyebrow}>FULL-SCREEN DESTINATION</Text>
				<Text style={styles.title}>Zoom route</Text>
				<Text style={styles.description}>
					Going back should restore the sheet&apos;s content transform to its
					0.5 snap point without losing translateY.
				</Text>

				<Pressable
					testID="style-reset-close-zoom"
					style={({ pressed }) => [
						styles.button,
						pressed && styles.buttonPressed,
					]}
					onPress={router.back}
				>
					<Text style={styles.buttonText}>Back to sheet</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#17172D",
		flex: 1,
	},
	hero: {
		alignItems: "center",
		flex: 1,
		justifyContent: "center",
	},
	orbit: {
		alignItems: "center",
		borderColor: "#A5A6FF",
		borderRadius: 120,
		borderWidth: 2,
		height: 150,
		justifyContent: "center",
		transform: [{ rotate: "-24deg" }],
		width: 240,
	},
	planet: {
		backgroundColor: "#FFB45B",
		borderRadius: 40,
		height: 80,
		transform: [{ rotate: "24deg" }],
		width: 80,
	},
	content: {
		padding: 24,
		paddingBottom: 30,
	},
	eyebrow: {
		color: "#A5A6FF",
		fontSize: 11,
		fontWeight: "800",
		letterSpacing: 1.2,
	},
	title: {
		color: "white",
		fontSize: 38,
		fontWeight: "800",
		letterSpacing: -1,
		marginTop: 8,
	},
	description: {
		color: "rgba(255,255,255,0.68)",
		fontSize: 15,
		lineHeight: 22,
		marginTop: 10,
	},
	button: {
		alignItems: "center",
		backgroundColor: "#5B5CE2",
		borderRadius: 16,
		marginTop: 22,
		padding: 17,
	},
	buttonPressed: {
		opacity: 0.82,
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "800",
	},
});
