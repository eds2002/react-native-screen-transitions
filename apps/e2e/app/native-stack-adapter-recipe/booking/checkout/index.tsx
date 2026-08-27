import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useBookingState } from "@/components/native-stack-adapter/booking-state";
import { useTheme } from "@/theme";

export default function CheckoutTravelers() {
	const theme = useTheme();
	const { travelers, setTravelers } = useBookingState();

	return (
		<View style={[styles.screen, { backgroundColor: theme.bg }]}>
			<Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
				STEP 1 OF 3
			</Text>
			<Text style={[styles.title, { color: theme.text }]}>Who’s coming?</Text>
			<Text style={[styles.copy, { color: theme.textSecondary }]}>
				This value lives above both nested navigators and should survive every
				push and pop.
			</Text>

			<View style={[styles.counter, { backgroundColor: theme.card }]}>
				<Pressable
					testID="adapter-booking-travelers-minus"
					onPress={() => setTravelers(Math.max(1, travelers - 1))}
					style={styles.counterButton}
				>
					<Text style={[styles.counterSymbol, { color: theme.text }]}>−</Text>
				</Pressable>
				<View style={styles.count}>
					<Text style={[styles.countValue, { color: theme.text }]}>
						{travelers}
					</Text>
					<Text style={[styles.countLabel, { color: theme.textSecondary }]}>
						travelers
					</Text>
				</View>
				<Pressable
					testID="adapter-booking-travelers-plus"
					onPress={() => setTravelers(Math.min(6, travelers + 1))}
					style={styles.counterButton}
				>
					<Text style={[styles.counterSymbol, { color: theme.text }]}>+</Text>
				</Pressable>
			</View>

			<Pressable
				testID="adapter-booking-next-preferences"
				onPress={() =>
					router.push(
						"/native-stack-adapter-recipe/booking/checkout/preferences",
					)
				}
				style={[styles.button, { backgroundColor: theme.actionButton }]}
			>
				<Text style={[styles.buttonText, { color: theme.actionButtonText }]}>
					Choose preferences
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
	copy: { marginTop: 10, fontSize: 15, lineHeight: 22, fontWeight: "500" },
	counter: {
		marginTop: 38,
		borderRadius: 26,
		padding: 18,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	counterButton: {
		width: 58,
		height: 58,
		borderRadius: 20,
		backgroundColor: "rgba(127,127,127,0.12)",
		alignItems: "center",
		justifyContent: "center",
	},
	counterSymbol: { fontSize: 30, fontWeight: "600" },
	count: { alignItems: "center" },
	countValue: { fontSize: 42, fontWeight: "900" },
	countLabel: { fontSize: 12, fontWeight: "700" },
	button: {
		marginTop: "auto",
		minHeight: 58,
		borderRadius: 19,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: { fontSize: 16, fontWeight: "800" },
});
