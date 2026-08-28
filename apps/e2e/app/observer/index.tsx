import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimationProbe } from "./animation-probe";

export default function ObserverIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["bottom"]}>
			<View style={styles.content}>
				<Text style={styles.eyebrow}>TRANSITION KEY CONTRACT</Text>
				<Text style={styles.title}>Nested index</Text>
				<Text style={styles.description}>
					Pink resolves observer-index. Blue resolves observer-root. They match
					the same-colored outer probes without relying on layout depth.
				</Text>

				<View style={styles.card}>
					<AnimationProbe
						color="#F472B6"
						label="observer-index"
						testID="observer-index-current"
					/>
					<AnimationProbe
						color="#38BDF8"
						label="observer-root"
						testID="observer-index-parent"
					/>
				</View>

				<Pressable
					testID="observer-open-child"
					style={({ pressed }) => [
						styles.button,
						pressed && styles.buttonPressed,
					]}
					onPress={() => router.push("/observer/child")}
				>
					<Text style={styles.buttonText}>Open child</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	button: {
		alignItems: "center",
		backgroundColor: "#2563EB",
		borderRadius: 14,
		padding: 16,
	},
	buttonPressed: {
		backgroundColor: "#1D4ED8",
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
		backgroundColor: "#F8FAFC",
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
		color: "#475569",
		fontSize: 15,
		lineHeight: 22,
	},
	eyebrow: {
		color: "#2563EB",
		fontSize: 11,
		fontWeight: "900",
		letterSpacing: 1.2,
	},
	title: {
		color: "#0F172A",
		fontSize: 34,
		fontWeight: "900",
		letterSpacing: -1,
	},
});
