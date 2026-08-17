import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";

export default function BookingDestination() {
	return (
		<SafeAreaView style={styles.screen}>
			<ScrollView contentContainerStyle={styles.content}>
				<Transition.Boundary.View id="booking-destination" style={styles.hero}>
					<View style={styles.sun} />
					<View style={styles.heroCopy}>
						<Text style={styles.location}>ERICEIRA, PORTUGAL</Text>
						<Text style={styles.heroTitle}>
							Atlantic light,{"\n"}slow mornings.
						</Text>
					</View>
				</Transition.Boundary.View>

				<View style={styles.body}>
					<View style={styles.facts}>
						<View>
							<Text style={styles.factLabel}>STAY</Text>
							<Text style={styles.fact}>3 nights</Text>
						</View>
						<View>
							<Text style={styles.factLabel}>FLIGHT</Text>
							<Text style={styles.fact}>Direct</Text>
						</View>
						<View>
							<Text style={styles.factLabel}>FROM</Text>
							<Text style={styles.fact}>$480</Text>
						</View>
					</View>
					<Text style={styles.description}>
						A small coastal hotel, a guided surf morning, and enough empty time
						to discover the town yourself.
					</Text>
					<Pressable
						testID="adapter-booking-start-checkout"
						onPress={() =>
							router.push("/native-stack-adapter-recipe/booking/checkout")
						}
						style={({ pressed }) => [
							styles.button,
							{ opacity: pressed ? 0.75 : 1 },
						]}
					>
						<Text style={styles.buttonText}>Reserve this trip</Text>
						<Text style={styles.buttonText}>→</Text>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: "#F7F2E9" },
	content: { paddingBottom: 28 },
	hero: {
		height: 455,
		backgroundColor: "#E75B3A",
		overflow: "hidden",
		justifyContent: "flex-end",
		padding: 24,
	},
	sun: {
		position: "absolute",
		width: 300,
		height: 300,
		borderRadius: 150,
		backgroundColor: "#FFD84D",
		top: -60,
		right: -40,
	},
	heroCopy: { gap: 10 },
	location: {
		color: "#301516",
		fontSize: 11,
		fontWeight: "900",
		letterSpacing: 1.7,
	},
	heroTitle: {
		color: "#301516",
		fontSize: 42,
		lineHeight: 43,
		fontWeight: "900",
		letterSpacing: -1.6,
	},
	body: { padding: 22, gap: 24 },
	facts: {
		flexDirection: "row",
		justifyContent: "space-between",
		backgroundColor: "white",
		padding: 18,
		borderRadius: 20,
	},
	factLabel: {
		color: "#9A9187",
		fontSize: 9,
		fontWeight: "900",
		letterSpacing: 1.2,
	},
	fact: { color: "#24201C", fontSize: 16, fontWeight: "800", marginTop: 4 },
	description: {
		color: "#5F574F",
		fontSize: 16,
		lineHeight: 24,
		fontWeight: "500",
	},
	button: {
		minHeight: 58,
		borderRadius: 19,
		paddingHorizontal: 20,
		backgroundColor: "#24201C",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	buttonText: { color: "white", fontSize: 16, fontWeight: "800" },
});
