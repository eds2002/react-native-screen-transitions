import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimationProbe } from "./animation-probe";

export default function ObserverChild() {
	return (
		<SafeAreaView style={styles.container} edges={["bottom"]}>
			<View style={styles.content}>
				<Text style={styles.eyebrow}>TRANSITION KEY CONTRACT</Text>
				<Text style={styles.title}>Nested child</Text>
				<Text style={styles.description}>
					Pink resolves observer-child. Blue resolves observer-root. Both keys
					remain stable while this screen dismisses.
				</Text>

				<View style={styles.card}>
					<AnimationProbe
						color="#F472B6"
						label="observer-child"
						testID="observer-child-current"
					/>
					<AnimationProbe
						color="#38BDF8"
						label="observer-root"
						testID="observer-child-parent"
					/>
				</View>

				<Pressable
					testID="observer-close-child"
					style={({ pressed }) => [
						styles.button,
						pressed && styles.buttonPressed,
					]}
					onPress={router.back}
				>
					<Text style={styles.buttonText}>Go back</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	button: {
		alignItems: "center",
		backgroundColor: "#DB2777",
		borderRadius: 14,
		padding: 16,
	},
	buttonPressed: {
		backgroundColor: "#BE185D",
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "800",
	},
	card: {
		backgroundColor: "#111827",
		borderRadius: 18,
		gap: 14,
		padding: 16,
	},
	container: {
		backgroundColor: "#FFF1F2",
		flex: 1,
	},
	content: {
		flex: 1,
		gap: 18,
		justifyContent: "center",
		padding: 20,
		paddingTop: 210,
	},
	description: {
		color: "#881337",
		fontSize: 15,
		lineHeight: 22,
	},
	eyebrow: {
		color: "#DB2777",
		fontSize: 11,
		fontWeight: "900",
		letterSpacing: 1.2,
	},
	title: {
		color: "#4C0519",
		fontSize: 32,
		fontWeight: "900",
		letterSpacing: -1,
	},
});
