import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DetailScreen() {
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Detail Screen</Text>
				<Text style={styles.description}>
					This is a nested detail screen. Test the back gesture or button.
				</Text>

				<Pressable
					testID="push-another"
					style={styles.button}
					onPress={() => router.push("/blank-stack/detail")}
				>
					<Text style={styles.buttonText}>Push Another Detail</Text>
				</Pressable>

				<Pressable
					testID="go-back"
					style={[styles.button, styles.secondaryButton]}
					onPress={() => router.back()}
				>
					<Text style={styles.buttonText}>Go Back</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#471a33",
	},
	content: {
		flex: 1,
		padding: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		fontSize: 28,
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
		marginBottom: 12,
		minWidth: 200,
		alignItems: "center",
	},
	secondaryButton: {
		backgroundColor: "rgba(0,0,0,0.3)",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},
});
