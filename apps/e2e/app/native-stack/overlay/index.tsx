import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OverlayIndex() {
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Overlay Demo</Text>
				<Text style={styles.subtitle}>Native Stack</Text>
				<Text style={styles.description}>
					Overlays now work in native-stack too! The floating tab bar animates
					with screen transitions using enableTransitions.
				</Text>

				<View style={styles.buttons}>
					<Pressable
						testID="push-second"
						style={styles.button}
						onPress={() => router.push("/native-stack/overlay/second")}
					>
						<Text style={styles.buttonText}>Push Second Screen</Text>
					</Pressable>

					<Pressable
						testID="push-no-overlay"
						style={[styles.button, styles.secondaryButton]}
						onPress={() => router.push("/native-stack/overlay/no-overlay")}
					>
						<Text style={styles.buttonText}>Push Without Overlay</Text>
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a4a5f",
	},
	content: {
		flex: 1,
		padding: 24,
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 4,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "500",
		color: "#4a9eff",
		marginBottom: 16,
	},
	description: {
		fontSize: 16,
		color: "rgba(255,255,255,0.7)",
		textAlign: "center",
		marginBottom: 40,
		lineHeight: 24,
	},
	buttons: {
		gap: 12,
		width: "100%",
		maxWidth: 280,
	},
	button: {
		backgroundColor: "rgba(255,255,255,0.2)",
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
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
