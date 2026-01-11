import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HorizontalDrawerScreen() {
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<View style={styles.handle} />
				<Text style={styles.title}>Horizontal Drawer</Text>
				<Text style={styles.description}>
					Slides from the right edge. Drag left/right to snap between 50% and
					100% width.
				</Text>

				<Pressable
					testID="go-back"
					style={styles.button}
					onPress={() => router.back()}
				>
					<Text style={styles.buttonText}>Close</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#2d1b4e",
		borderTopLeftRadius: 16,
		borderBottomLeftRadius: 16,
	},
	content: {
		flex: 1,
		padding: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	handle: {
		width: 4,
		height: 40,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		position: "absolute",
		left: 8,
		top: "50%",
		marginTop: -20,
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
		paddingHorizontal: 20,
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
