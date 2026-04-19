import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { buildStackPath, useResolvedStackType } from "@/components/stack-examples/stack-routing";

export default function OverlaySecond() {
	const stackType = useResolvedStackType();
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Second Screen</Text>
				<Text style={styles.description}>
					The overlay remains visible and shows the updated route. Notice the
					tab bar dims as more screens stack.
				</Text>

				<View style={styles.buttons}>
					<Pressable
						testID="push-third"
						style={styles.button}
						onPress={() => router.push(buildStackPath(stackType, "overlay/third"))}
					>
						<Text style={styles.buttonText}>Push Third Screen</Text>
					</Pressable>

					<Pressable
						testID="go-back"
						style={[styles.button, styles.secondaryButton]}
						onPress={() => router.back()}
					>
						<Text style={styles.buttonText}>Go Back</Text>
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#2d4a3e",
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
		marginBottom: 16,
		textAlign: "center",
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
