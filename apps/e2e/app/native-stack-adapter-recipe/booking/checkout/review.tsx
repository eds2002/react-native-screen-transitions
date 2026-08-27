import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBookingState } from "@/components/native-stack-adapter/booking-state";

export default function CheckoutReview() {
	const { travelers, seat, insurance } = useBookingState();
	const total = 480 * travelers + (insurance ? 42 : 0);

	return (
		<SafeAreaView style={styles.screen}>
			<View style={styles.badge}>
				<Text style={styles.badgeText}>READY TO BOOK</Text>
			</View>
			<Text style={styles.title}>Ericeira is waiting.</Text>
			<Text style={styles.copy}>
				The selections made across the nested flow are still here.
			</Text>

			<View style={styles.summary}>
				<Row label="Travelers" value={String(travelers)} />
				<Row label="Seat" value={seat === "window" ? "Window" : "Aisle"} />
				<Row
					label="Protection"
					value={insurance ? "Included" : "Not included"}
				/>
				<View style={styles.divider} />
				<Row label="Total" value={`$${total}`} strong />
			</View>

			<Pressable
				testID="adapter-booking-finish"
				onPress={() => router.dismissTo("/native-stack-adapter-recipe")}
				style={styles.button}
			>
				<Text style={styles.buttonText}>Finish demo</Text>
			</Pressable>
			<Text style={styles.hint}>
				Swipe down to return to preferences, then back through every nested
				stack.
			</Text>
		</SafeAreaView>
	);
}

function Row({
	label,
	value,
	strong = false,
}: {
	label: string;
	value: string;
	strong?: boolean;
}) {
	return (
		<View style={styles.row}>
			<Text style={[styles.rowText, strong && styles.strong]}>{label}</Text>
			<Text style={[styles.rowText, strong && styles.strong]}>{value}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: "#17151B",
		padding: 24,
		justifyContent: "center",
	},
	badge: {
		alignSelf: "flex-start",
		backgroundColor: "#E75B3A",
		borderRadius: 10,
		paddingHorizontal: 11,
		paddingVertical: 7,
	},
	badgeText: {
		color: "#17151B",
		fontSize: 10,
		fontWeight: "900",
		letterSpacing: 1.3,
	},
	title: {
		color: "white",
		fontSize: 42,
		lineHeight: 44,
		fontWeight: "900",
		letterSpacing: -1.7,
		marginTop: 18,
	},
	copy: {
		color: "#A9A5B0",
		fontSize: 15,
		lineHeight: 22,
		fontWeight: "500",
		marginTop: 10,
	},
	summary: {
		backgroundColor: "#25222A",
		borderRadius: 24,
		padding: 20,
		gap: 16,
		marginTop: 34,
	},
	row: { flexDirection: "row", justifyContent: "space-between" },
	rowText: {
		color: "#B9B5BF",
		fontSize: 15,
		fontWeight: "600",
		textTransform: "capitalize",
	},
	strong: { color: "white", fontSize: 20, fontWeight: "900" },
	divider: { height: 1, backgroundColor: "#3B3741" },
	button: {
		minHeight: 58,
		borderRadius: 19,
		backgroundColor: "#E75B3A",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 22,
	},
	buttonText: { color: "#17151B", fontSize: 16, fontWeight: "900" },
	hint: {
		color: "#77727E",
		textAlign: "center",
		fontSize: 12,
		lineHeight: 18,
		marginTop: 14,
	},
});
