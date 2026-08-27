import { router } from "expo-router";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useBookingState } from "@/components/native-stack-adapter/booking-state";
import { useTheme } from "@/theme";

export default function CheckoutPreferences() {
	const theme = useTheme();
	const { seat, setSeat, insurance, setInsurance } = useBookingState();

	return (
		<View style={[styles.screen, { backgroundColor: theme.bg }]}>
			<Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
				STEP 2 OF 3
			</Text>
			<Text style={[styles.title, { color: theme.text }]}>Make it yours.</Text>

			<View style={styles.section}>
				<Text style={[styles.label, { color: theme.textSecondary }]}>
					SEAT PREFERENCE
				</Text>
				<View style={styles.row}>
					{(["window", "aisle"] as const).map((value) => (
						<Pressable
							key={value}
							testID={`adapter-booking-seat-${value}`}
							onPress={() => setSeat(value)}
							style={[
								styles.choice,
								{
									backgroundColor:
										seat === value ? theme.actionButton : theme.card,
								},
							]}
						>
							<Text
								style={[
									styles.choiceIcon,
									{
										color: seat === value ? theme.actionButtonText : theme.text,
									},
								]}
							>
								{value === "window" ? "◫" : "↔"}
							</Text>
							<Text
								style={[
									styles.choiceText,
									{
										color: seat === value ? theme.actionButtonText : theme.text,
									},
								]}
							>
								{value === "window" ? "Window" : "Aisle"}
							</Text>
						</Pressable>
					))}
				</View>
			</View>

			<View style={[styles.insurance, { backgroundColor: theme.card }]}>
				<View style={styles.insuranceCopy}>
					<Text style={[styles.insuranceTitle, { color: theme.text }]}>
						Travel protection
					</Text>
					<Text style={[styles.insuranceBody, { color: theme.textSecondary }]}>
						Flexible cancellation for this booking.
					</Text>
				</View>
				<Switch
					testID="adapter-booking-insurance"
					value={insurance}
					onValueChange={setInsurance}
				/>
			</View>

			<Pressable
				testID="adapter-booking-next-review"
				onPress={() =>
					router.push("/native-stack-adapter-recipe/booking/checkout/review")
				}
				style={[styles.button, { backgroundColor: theme.actionButton }]}
			>
				<Text style={[styles.buttonText, { color: theme.actionButtonText }]}>
					Review booking
				</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, padding: 22, paddingTop: 42 },
	eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.6 },
	title: {
		marginTop: 10,
		fontSize: 38,
		fontWeight: "900",
		letterSpacing: -1.4,
	},
	section: { marginTop: 38, gap: 10 },
	label: { fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
	row: { flexDirection: "row", gap: 10 },
	choice: {
		flex: 1,
		height: 118,
		borderRadius: 22,
		padding: 16,
		justifyContent: "space-between",
	},
	choiceIcon: { fontSize: 27, fontWeight: "700" },
	choiceText: { fontSize: 16, fontWeight: "800", textTransform: "capitalize" },
	insurance: {
		marginTop: 18,
		borderRadius: 22,
		padding: 17,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	insuranceCopy: { flex: 1, gap: 4 },
	insuranceTitle: { fontSize: 16, fontWeight: "800" },
	insuranceBody: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
	button: {
		marginTop: "auto",
		minHeight: 58,
		borderRadius: 19,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: { fontSize: 16, fontWeight: "800" },
});
