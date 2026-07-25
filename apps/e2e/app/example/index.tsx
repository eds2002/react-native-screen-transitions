import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";

export default function ExampleIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top", "bottom"]}
		>
			<View style={styles.content}>
				<Text style={[styles.eyebrow, { color: theme.textTertiary }]}>
					STYLE RESET REPRODUCTION
				</Text>
				<Text style={[styles.title, { color: theme.text }]}>
					Half sheet → zoom
				</Text>
				<Text style={[styles.description, { color: theme.textSecondary }]}>
					The next screen opens at a single 0.5 snap point. From there, push the
					full-screen zoom route and return to inspect the sheet&apos;s
					translateY.
				</Text>

				<View style={[styles.steps, { backgroundColor: theme.card }]}>
					<Text style={[styles.step, { color: theme.textSecondary }]}>
						1. Open the half-height sheet
					</Text>
					<Text style={[styles.step, { color: theme.textSecondary }]}>
						2. Push the zoom screen
					</Text>
					<Text style={[styles.step, { color: theme.textSecondary }]}>
						3. Go back and check the sheet position
					</Text>
				</View>

				<Pressable
					testID="style-reset-open-sheet"
					style={({ pressed }) => [
						styles.button,
						{
							backgroundColor: pressed ? theme.cardPressed : theme.actionButton,
						},
					]}
					onPress={() => router.push("/example/sheet")}
				>
					<Text style={[styles.buttonText, { color: theme.actionButtonText }]}>
						Open 0.5 sheet
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: "center",
		padding: 24,
	},
	eyebrow: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1.2,
	},
	title: {
		fontSize: 36,
		fontWeight: "800",
		letterSpacing: -1,
		marginTop: 10,
	},
	description: {
		fontSize: 16,
		lineHeight: 24,
		marginTop: 14,
	},
	steps: {
		borderRadius: 18,
		gap: 10,
		marginTop: 28,
		padding: 18,
	},
	step: {
		fontSize: 14,
		fontWeight: "600",
	},
	button: {
		alignItems: "center",
		borderRadius: 16,
		marginTop: 20,
		padding: 17,
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "800",
	},
});
