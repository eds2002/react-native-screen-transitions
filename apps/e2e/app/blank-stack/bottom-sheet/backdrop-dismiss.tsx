import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function BackdropDismissScreen() {
	return (
		<View style={styles.container}>
			<View style={styles.sheet}>
				<View style={styles.handle} />
				<Text style={styles.title}>Backdrop Dismiss</Text>
				<Text style={styles.description}>
					Tap anywhere outside this sheet to dismiss. The backdrop area is
					tappable.
				</Text>

				<Pressable
					testID="go-back"
					style={styles.button}
					onPress={() => router.back()}
				>
					<Text style={styles.buttonText}>Close</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-end",
	},
	sheet: {
		backgroundColor: "#1e3a5f",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 20,
		paddingTop: 12,
		alignItems: "center",
		minHeight: 300,
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		marginBottom: 20,
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
