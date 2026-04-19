import { router } from "expo-router";
import { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.5;

export default function TouchGatingScreenBPassthrough() {
	const [tapCount, setTapCount] = useState(0);
	const theme = useTheme();

	return (
		<View style={styles.container} pointerEvents="box-none">
			<View style={styles.spacer} pointerEvents="box-none" />
			<Pressable
				style={[styles.sheet, { backgroundColor: theme.card }]}
				onPress={() => setTapCount((c) => c + 1)}
			>
				<View style={[styles.handle, { backgroundColor: theme.handle }]} />

				<View style={styles.header}>
					<Text style={[styles.title, { color: theme.text }]}>Screen B</Text>
					<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
						Passthrough enabled
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
					Tap on this sheet to increment this counter.{"\n"}
					Tap ABOVE this sheet (on Screen A) - those taps go to A!
				</Text>

				<View style={[styles.infoBox, { backgroundColor: theme.infoBox }]}>
					<Text style={[styles.infoTitle, { color: theme.text }]}>
						Touch Gating: PASSTHROUGH
					</Text>
					<Text style={[styles.infoText, { color: theme.textSecondary }]}>
						Screen A below IS receiving touches in the area not covered by this
						sheet.
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
	spacer: {
		flex: 1,
	},
	sheet: {
		height: SHEET_HEIGHT,
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
		marginBottom: 16,
	},
	header: {
		alignItems: "center",
		marginBottom: 16,
	},
	title: {
		fontSize: 22,
		fontWeight: "bold",
	},
	subtitle: {
		fontSize: 13,
		marginTop: 4,
	},
	counterContainer: {
		alignItems: "center",
		marginBottom: 16,
	},
	counterLabel: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 4,
	},
	counterValue: {
		fontSize: 48,
		fontWeight: "bold",
	},
	instructions: {
		fontSize: 13,
		textAlign: "center",
		lineHeight: 18,
		marginBottom: 12,
	},
	infoBox: {
		padding: 12,
		borderRadius: 14,
		marginBottom: 12,
	},
	infoTitle: {
		fontSize: 13,
		fontWeight: "700",
		marginBottom: 4,
	},
	infoText: {
		fontSize: 12,
	},
	buttonContainer: {
		marginBottom: 12,
	},
	button: {
		padding: 14,
		borderRadius: 999,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 15,
		fontWeight: "600",
	},
	hint: {
		fontSize: 11,
		textAlign: "center",
	},
});
