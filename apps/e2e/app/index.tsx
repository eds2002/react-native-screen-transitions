import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
	return (
		<SafeAreaView style={styles.container}>
			<Text style={styles.title}>Screen Transitions E2E</Text>
			<Text style={styles.subtitle}>Select a stack type to test</Text>

			<View style={styles.buttonContainer}>
				<Pressable
					testID="native-stack-button"
					style={styles.button}
					onPress={() => router.push("/native-stack")}
				>
					<Text style={styles.buttonTitle}>Native Stack</Text>
					<Text style={styles.buttonDescription}>
						Uses @react-navigation/native-stack with custom transitions
					</Text>
				</Pressable>

				<Pressable
					testID="blank-stack-button"
					style={styles.button}
					onPress={() => router.push("/blank-stack")}
				>
					<Text style={styles.buttonTitle}>Blank Stack</Text>
					<Text style={styles.buttonDescription}>
						Pure JS stack with full control over transitions
					</Text>
				</Pressable>

				<Pressable
					testID="component-stack-button"
					style={styles.button}
					onPress={() => router.push("/component-stack")}
				>
					<Text style={styles.buttonTitle}>Component Stack</Text>
					<Text style={styles.buttonDescription}>
						Standalone navigator with bounds-based floating animation
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
		padding: 20,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#fff",
		marginTop: 40,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		color: "#888",
		marginTop: 8,
		textAlign: "center",
	},
	buttonContainer: {
		flex: 1,
		justifyContent: "center",
		gap: 20,
	},
	button: {
		backgroundColor: "#1e1e1e",
		padding: 24,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#333",
	},
	buttonTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 8,
	},
	buttonDescription: {
		fontSize: 14,
		color: "#888",
	},
});
