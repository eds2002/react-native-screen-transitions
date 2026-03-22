import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme";

export default function TouchGatingScreenB() {
	const [tapCount, setTapCount] = useState(0);
	const theme = useTheme();

	return (
		<View style={styles.container}>
			<Pressable
				style={[styles.sheet, { backgroundColor: theme.card }]}
				onPress={() => setTapCount((c) => c + 1)}
			>
				<View style={[styles.handle, { backgroundColor: theme.handle }]} />

				<View style={styles.header}>
					<Text style={[styles.title, { color: theme.text }]}>Screen B</Text>
					<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
						Touches are blocked below
					</Text>
				</View>

				<View style={styles.counterContainer}>
					<Text style={[styles.counterLabel, { color: theme.textSecondary }]}>
						Screen B Taps
					</Text>
					<Text style={[styles.counterValue, { color: theme.text }]}>
						{tapCount}
					</Text>
				</View>

				<Text style={[styles.instructions, { color: theme.textTertiary }]}>
					Tap anywhere on this sheet to increment the counter.{"\n"}
					Try tapping where Screen A would be - it should NOT count.
				</Text>

				<View style={[styles.infoBox, { backgroundColor: theme.infoBox }]}>
					<Text style={[styles.infoTitle, { color: theme.text }]}>
						Touch Gating: BLOCK
					</Text>
					<Text style={[styles.infoText, { color: theme.textSecondary }]}>
						Screen A below is NOT receiving touches while this screen is open.
					</Text>
				</View>

				<View style={styles.buttonContainer}>
					<Pressable
						style={({ pressed }) => [
							styles.button,
							{ backgroundColor: pressed ? theme.secondaryButtonPressed : theme.secondaryButton },
						]}
						onPress={() => router.back()}
					>
						<Text style={[styles.buttonText, { color: theme.secondaryButtonText }]}>
							Go Back
						</Text>
					</Pressable>
				</View>

				<Text style={[styles.hint, { color: theme.textTertiary }]}>
					Swipe down to dismiss
				</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	sheet: {
		flex: 1,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		paddingHorizontal: 20,
		paddingTop: 10,
	},
	handle: {
		width: 44,
		height: 5,
		borderRadius: 3,
		alignSelf: "center",
		marginBottom: 20,
	},
	header: {
		alignItems: "center",
		marginBottom: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
	},
	subtitle: {
		fontSize: 14,
		marginTop: 4,
	},
	counterContainer: {
		alignItems: "center",
		marginBottom: 24,
	},
	counterLabel: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 8,
	},
	counterValue: {
		fontSize: 64,
		fontWeight: "bold",
	},
	instructions: {
		fontSize: 14,
		textAlign: "center",
		lineHeight: 20,
		marginBottom: 20,
	},
	infoBox: {
		padding: 16,
		borderRadius: 14,
		marginBottom: 20,
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: "700",
		marginBottom: 4,
	},
	infoText: {
		fontSize: 13,
	},
	buttonContainer: {
		marginBottom: 20,
	},
	button: {
		padding: 16,
		borderRadius: 999,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
	},
	hint: {
		fontSize: 12,
		textAlign: "center",
	},
});
