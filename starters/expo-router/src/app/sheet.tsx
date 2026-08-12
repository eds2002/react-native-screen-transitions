import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActionButton } from "../components/action-button";

export default function SheetScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.sheet} edges={["bottom"]}>
			<View style={styles.grabber} />
			<Text style={styles.eyebrow}>SNAP SHEET</Text>
			<Text style={styles.title}>Half height, then full screen.</Text>
			<Text style={styles.description}>
				Drag between the 0.55 and 1.0 detents. Drag below the first detent to
				dismiss the route.
			</Text>
			<View style={styles.spacer} />
			<ActionButton label="Close sheet" onPress={router.back} secondary />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	description: {
		color: "#5F566B",
		fontSize: 16,
		lineHeight: 24,
		marginTop: 12,
	},
	eyebrow: {
		color: "#7958B5",
		fontSize: 12,
		fontWeight: "800",
		letterSpacing: 1.1,
		marginTop: 28,
	},
	grabber: {
		alignSelf: "center",
		backgroundColor: "#C8BFCE",
		borderRadius: 3,
		height: 5,
		width: 48,
	},
	sheet: {
		backgroundColor: "#F4F1FF",
		borderTopLeftRadius: 30,
		borderTopRightRadius: 30,
		flex: 1,
		padding: 24,
	},
	spacer: {
		flex: 1,
	},
	title: {
		color: "#21182B",
		fontSize: 34,
		fontWeight: "800",
		letterSpacing: -1,
		lineHeight: 38,
		marginTop: 10,
	},
});
