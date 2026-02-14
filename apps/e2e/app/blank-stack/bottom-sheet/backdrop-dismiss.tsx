import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SNAP = 0.4;
const MAX_HEIGHT = SCREEN_HEIGHT * MAX_SNAP;

export default function BackdropDismissScreen() {
	return (
		<View style={styles.container}>
			<View style={[styles.sheet, { maxHeight: MAX_HEIGHT }]}>
				<View style={styles.handle} />

				{/* Icon */}
				<View style={styles.iconCircle}>
					<Ionicons name="trash" size={32} color="#FF6B6B" />
				</View>

				<Text style={styles.title}>Delete Project?</Text>
				<Text style={styles.subtitle}>
					This will permanently delete "Design System v3" and all 48 files. This
					action cannot be undone.
				</Text>

				{/* Buttons */}
				<Pressable style={styles.deleteButton} onPress={() => router.back()}>
					<Ionicons name="trash-outline" size={18} color="#fff" />
					<Text style={styles.deleteText}>Delete Forever</Text>
				</Pressable>

				<Pressable style={styles.cancelButton} onPress={() => router.back()}>
					<Text style={styles.cancelText}>Cancel</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	sheet: {
		flex: 1,
		backgroundColor: "#0D0D1A",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		paddingHorizontal: 24,
		alignItems: "center",
		paddingTop: 12,
	},
	handle: {
		width: 44,
		height: 5,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 3,
		marginBottom: 20,
	},
	iconCircle: {
		width: 68,
		height: 68,
		borderRadius: 24,
		backgroundColor: "#FF6B6B15",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 16,
	},
	title: {
		fontSize: 26,
		fontWeight: "900",
		color: "#fff",
		marginBottom: 8,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 15,
		fontWeight: "500",
		color: "rgba(255,255,255,0.45)",
		textAlign: "center",
		lineHeight: 22,
		marginBottom: 24,
		paddingHorizontal: 8,
	},
	deleteButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#FF6B6B",
		borderRadius: 18,
		paddingVertical: 16,
		width: "100%",
		gap: 8,
		marginBottom: 10,
	},
	deleteText: {
		fontSize: 17,
		fontWeight: "900",
		color: "#fff",
	},
	cancelButton: {
		paddingVertical: 14,
		width: "100%",
		alignItems: "center",
	},
	cancelText: {
		fontSize: 16,
		fontWeight: "700",
		color: "rgba(255,255,255,0.45)",
	},
});
