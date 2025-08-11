import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import Transition from "react-native-screen-transitions";

export default function PaletteProfile() {
	return (
		<Pressable style={styles.container} onPress={router.back}>
			<Transition.View style={styles.profileIcon} sharedBoundTag={"profile"}>
				<Text style={styles.profileIconText}>U</Text>
			</Transition.View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},

	profileIcon: {
		width: 200,
		height: 200,
		borderRadius: 200,
		backgroundColor: "#E9ECEF",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
	},
	profileIconText: {
		fontSize: 48,
		fontWeight: "bold",
		color: "#6C757D",
	},
	profileName: {
		fontSize: 20,
		fontWeight: "600",
		color: "white",
	},
	profileDescription: {
		fontSize: 14,
		color: "white",
		fontWeight: "500",
		textAlign: "center",
		opacity: 0.6,
	},
	tab: {
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	tabText: {
		fontSize: 16,
		fontWeight: "600",
		color: "white", // Blue color
	},
	paletteContainer: {
		paddingHorizontal: 20,
		gap: 16,
	},
	paletteItem: {
		height: 60,
		borderRadius: 36,
	},
});
