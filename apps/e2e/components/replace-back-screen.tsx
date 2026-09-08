import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const colors = { A: "#166534", B: "#991b1b", C: "#1e40af" };

export function ReplaceBackScreen({ screen }: { screen: "A" | "B" | "C" }) {
	return (
		<View
			testID={`replace-back-${screen}`}
			style={[styles.screen, { backgroundColor: colors[screen] }]}
		>
			<Text style={styles.label}>{screen}</Text>
			<Text style={styles.text}>
				{screen === "A"
					? "A should appear underneath C when swiping back."
					: screen === "B"
						? "B will be removed from history by replace."
						: "Slowly swipe right. You should see green A, never red B. Complete the gesture: you should land on A without a snap."}
			</Text>
			{screen !== "C" && (
				<Pressable
					accessibilityRole="button"
					testID={`replace-back-${screen === "A" ? "push" : "replace"}`}
					style={styles.button}
					onPress={() =>
						screen === "A"
							? router.push("/replace-back/b")
							: router.replace("/replace-back/c")
					}
				>
					<Text style={styles.text}>
						{screen === "A" ? "Push B" : "Replace with C"}
					</Text>
				</Pressable>
			)}
			<Pressable
				accessibilityRole="button"
				style={styles.button}
				onPress={() => router.back()}
			>
				<Text style={styles.text}>
					{screen === "A" ? "Exit reproduction" : "Back"}
				</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, justifyContent: "center", padding: 32, gap: 24 },
	label: { color: "white", fontSize: 96, fontWeight: "bold" },
	text: { color: "white", fontSize: 18 },
	button: { padding: 16, borderRadius: 12, backgroundColor: "#ffffff22" },
});
