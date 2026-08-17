import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";

export default function BookingIndex() {
	const theme = useTheme();

	return (
		<ScrollView
			style={{ backgroundColor: theme.bg }}
			contentContainerStyle={styles.content}
		>
			<View style={styles.heading}>
				<Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
					WEEKEND PICKS
				</Text>
				<Text style={[styles.title, { color: theme.text }]}>
					Go somewhere worth remembering.
				</Text>
			</View>

			<Transition.Boundary.Trigger
				id="booking-destination"
				testID="adapter-booking-open-destination"
				onPress={() =>
					router.push("/native-stack-adapter-recipe/booking/destination")
				}
				style={styles.destination}
			>
				<View style={styles.sun} />
				<View style={styles.destinationCopy}>
					<Text style={styles.location}>PORTUGAL · 3 NIGHTS</Text>
					<Text style={styles.destinationTitle}>
						Atlantic light,{"\n"}slow mornings.
					</Text>
					<Text style={styles.price}>From $480</Text>
				</View>
			</Transition.Boundary.Trigger>

			<View style={styles.secondaryRow}>
				<View style={[styles.smallCard, { backgroundColor: theme.card }]}>
					<Text style={styles.smallEmoji}>🏔️</Text>
					<Text style={[styles.smallTitle, { color: theme.text }]}>
						Dolomites
					</Text>
					<Text style={[styles.smallMeta, { color: theme.textSecondary }]}>
						5 nights
					</Text>
				</View>
				<View style={[styles.smallCard, { backgroundColor: theme.card }]}>
					<Text style={styles.smallEmoji}>🌊</Text>
					<Text style={[styles.smallTitle, { color: theme.text }]}>
						Okinawa
					</Text>
					<Text style={[styles.smallMeta, { color: theme.textSecondary }]}>
						4 nights
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	content: { padding: 20, paddingBottom: 40, gap: 24 },
	heading: { gap: 8, marginTop: 12 },
	eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.8 },
	title: {
		fontSize: 36,
		lineHeight: 39,
		fontWeight: "900",
		letterSpacing: -1.4,
	},
	destination: {
		height: 410,
		borderRadius: 28,
		backgroundColor: "#E75B3A",
		overflow: "hidden",
		padding: 24,
		justifyContent: "flex-end",
	},
	sun: {
		position: "absolute",
		width: 230,
		height: 230,
		borderRadius: 115,
		backgroundColor: "#FFD84D",
		top: -34,
		right: -30,
	},
	destinationCopy: { gap: 10 },
	location: {
		color: "#301516",
		fontSize: 11,
		fontWeight: "900",
		letterSpacing: 1.6,
	},
	destinationTitle: {
		color: "#301516",
		fontSize: 39,
		lineHeight: 40,
		fontWeight: "900",
		letterSpacing: -1.4,
	},
	price: { color: "rgba(48,21,22,0.72)", fontSize: 15, fontWeight: "800" },
	secondaryRow: { flexDirection: "row", gap: 12 },
	smallCard: { flex: 1, borderRadius: 22, padding: 18, gap: 5 },
	smallEmoji: { fontSize: 30, marginBottom: 12 },
	smallTitle: { fontSize: 18, fontWeight: "800" },
	smallMeta: { fontSize: 13, fontWeight: "600" },
});
