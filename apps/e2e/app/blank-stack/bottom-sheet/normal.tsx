import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const REVIEWS = [
	{
		id: 1,
		name: "Alex M.",
		rating: 5,
		text: "Absolutely incredible omakase experience. Chef Tanaka's bluefin tuna was otherworldly.",
		date: "2 days ago",
	},
	{
		id: 2,
		name: "Priya K.",
		rating: 5,
		text: "Best sushi in the city, hands down. The uni was incredibly fresh.",
		date: "1 week ago",
	},
	{
		id: 3,
		name: "Jordan L.",
		rating: 4,
		text: "Amazing food but a bit pricey. The A5 wagyu course was worth every penny though.",
		date: "2 weeks ago",
	},
];

export default function NormalScreen() {
	const insets = useSafeAreaInsets();

	return (
		<View style={styles.container}>
			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={[
					styles.content,
					{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
				]}
			>
				{/* Hero */}
				<View style={styles.hero}>
					<Ionicons name="restaurant" size={56} color="rgba(255,255,255,0.2)" />
				</View>

				<Text style={styles.title}>Sakura Omakase</Text>
				<Text style={styles.subtitle}>
					Japanese · $$$$ · 123 Main St, San Francisco
				</Text>

				{/* Stats Row */}
				<View style={styles.statsRow}>
					<View style={styles.stat}>
						<Text style={styles.statValue}>4.8</Text>
						<Text style={styles.statLabel}>Rating</Text>
					</View>
					<View style={styles.statDivider} />
					<View style={styles.stat}>
						<Text style={styles.statValue}>2.4k</Text>
						<Text style={styles.statLabel}>Reviews</Text>
					</View>
					<View style={styles.statDivider} />
					<View style={styles.stat}>
						<Text style={styles.statValue}>$$$$</Text>
						<Text style={styles.statLabel}>Price</Text>
					</View>
				</View>

				{/* About */}
				<Text style={styles.sectionTitle}>About</Text>
				<Text style={styles.aboutText}>
					An intimate 12-seat omakase counter helmed by Chef Hiroshi Tanaka,
					featuring seasonal fish flown in daily from Tsukiji Market. Each
					course tells a story of tradition meets innovation.
				</Text>

				{/* Hours */}
				<Text style={styles.sectionTitle}>Hours</Text>
				<View style={styles.hoursCard}>
					{[
						["Mon–Thu", "5:30 – 10:00 PM"],
						["Fri–Sat", "5:00 – 11:00 PM"],
						["Sunday", "Closed"],
					].map(([day, hours]) => (
						<View key={day} style={styles.hoursRow}>
							<Text style={styles.hoursDay}>{day}</Text>
							<Text style={styles.hoursTime}>{hours}</Text>
						</View>
					))}
				</View>

				{/* Reviews */}
				<Text style={styles.sectionTitle}>Reviews</Text>
				{REVIEWS.map((review) => (
					<View key={review.id} style={styles.reviewCard}>
						<View style={styles.reviewHeader}>
							<View style={styles.avatar}>
								<Text style={styles.avatarText}>{review.name.charAt(0)}</Text>
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.reviewName}>{review.name}</Text>
								<View style={styles.starsRow}>
									{Array.from({ length: review.rating }).map((_, i) => (
										<Ionicons key={i} name="star" size={12} color="#FDCB6E" />
									))}
								</View>
							</View>
							<Text style={styles.reviewDate}>{review.date}</Text>
						</View>
						<Text style={styles.reviewText}>{review.text}</Text>
					</View>
				))}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0D0D1A",
	},
	content: {
		paddingHorizontal: 20,
	},
	hero: {
		height: 220,
		borderRadius: 28,
		backgroundColor: "rgba(255,255,255,0.05)",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 20,
	},
	title: {
		fontSize: 32,
		fontWeight: "900",
		color: "#fff",
		marginBottom: 6,
	},
	subtitle: {
		fontSize: 15,
		fontWeight: "600",
		color: "rgba(255,255,255,0.4)",
		marginBottom: 24,
	},
	statsRow: {
		flexDirection: "row",
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 20,
		padding: 20,
		marginBottom: 28,
	},
	stat: {
		flex: 1,
		alignItems: "center",
	},
	statValue: {
		fontSize: 22,
		fontWeight: "900",
		color: "#fff",
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 12,
		fontWeight: "700",
		color: "rgba(255,255,255,0.35)",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	statDivider: {
		width: 1,
		backgroundColor: "rgba(255,255,255,0.08)",
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "900",
		color: "#fff",
		marginBottom: 12,
	},
	aboutText: {
		fontSize: 15,
		fontWeight: "500",
		color: "rgba(255,255,255,0.55)",
		lineHeight: 24,
		marginBottom: 28,
	},
	hoursCard: {
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 20,
		padding: 16,
		gap: 12,
		marginBottom: 28,
	},
	hoursRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	hoursDay: {
		fontSize: 15,
		fontWeight: "700",
		color: "rgba(255,255,255,0.6)",
	},
	hoursTime: {
		fontSize: 15,
		fontWeight: "600",
		color: "rgba(255,255,255,0.4)",
	},
	reviewCard: {
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 20,
		padding: 16,
		marginBottom: 10,
	},
	reviewHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 10,
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 14,
		backgroundColor: "#6C5CE7",
		justifyContent: "center",
		alignItems: "center",
	},
	avatarText: {
		fontSize: 16,
		fontWeight: "800",
		color: "#fff",
	},
	reviewName: {
		fontSize: 15,
		fontWeight: "800",
		color: "#fff",
	},
	starsRow: {
		flexDirection: "row",
		gap: 2,
		marginTop: 2,
	},
	reviewDate: {
		fontSize: 12,
		fontWeight: "600",
		color: "rgba(255,255,255,0.25)",
	},
	reviewText: {
		fontSize: 14,
		fontWeight: "500",
		color: "rgba(255,255,255,0.55)",
		lineHeight: 22,
	},
});
