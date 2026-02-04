import { Ionicons } from "@expo/vector-icons";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SNAP = 0.8;
const MAX_HEIGHT = SCREEN_HEIGHT * MAX_SNAP;

const RESULTS = [
	{
		id: 1,
		icon: "location" as const,
		iconBg: "#E84393",
		title: "Golden Gate Bridge",
		subtitle: "Landmark · San Francisco, CA",
		distance: "2.1 mi",
	},
	{
		id: 2,
		icon: "restaurant" as const,
		iconBg: "#FDCB6E",
		title: "Golden Boy Pizza",
		subtitle: "Restaurant · North Beach",
		distance: "0.8 mi",
	},
	{
		id: 3,
		icon: "cafe" as const,
		iconBg: "#00B894",
		title: "Golden Gate Grind",
		subtitle: "Coffee Shop · SOMA",
		distance: "0.3 mi",
	},
	{
		id: 4,
		icon: "fitness" as const,
		iconBg: "#FF6B6B",
		title: "Gold's Gym Downtown",
		subtitle: "Fitness · Financial District",
		distance: "0.5 mi",
	},
	{
		id: 5,
		icon: "beer" as const,
		iconBg: "#6C5CE7",
		title: "Golden State Brewing",
		subtitle: "Brewery · Mission District",
		distance: "1.2 mi",
	},
	{
		id: 6,
		icon: "leaf" as const,
		iconBg: "#00B894",
		title: "Golden Gate Park",
		subtitle: "Park · Richmond District",
		distance: "3.4 mi",
	},
	{
		id: 7,
		icon: "cart" as const,
		iconBg: "#74B9FF",
		title: "Golden Produce Market",
		subtitle: "Grocery · Sunset District",
		distance: "4.1 mi",
	},
	{
		id: 8,
		icon: "school" as const,
		iconBg: "#FDCB6E",
		title: "Golden Gate University",
		subtitle: "University · SOMA",
		distance: "0.6 mi",
	},
	{
		id: 9,
		icon: "medical" as const,
		iconBg: "#FF6B6B",
		title: "Golden Medical Group",
		subtitle: "Healthcare · Pacific Heights",
		distance: "1.8 mi",
	},
	{
		id: 10,
		icon: "boat" as const,
		iconBg: "#74B9FF",
		title: "Golden Gate Ferry",
		subtitle: "Transportation · Embarcadero",
		distance: "0.9 mi",
	},
];

export default function WithScrollInvertedScreen() {
	const insets = useSafeAreaInsets();

	return (
		<View style={styles.container}>
			{/* Content anchored to bottom for inverted (top) sheet */}
			<View
				style={[
					styles.sheet,
					{
						maxHeight: MAX_HEIGHT,
					},
				]}
			>
				{/* Search Header with safe area */}
				<View style={[styles.searchHeader, { paddingTop: insets.top + 8 }]}>
					<View style={styles.searchBar}>
						<Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
						<Text style={styles.searchText}>golden</Text>
						<View style={styles.clearBtn}>
							<Ionicons
								name="close-circle"
								size={18}
								color="rgba(255,255,255,0.3)"
							/>
						</View>
					</View>
				</View>

				{/* Quick Filters */}
				<View style={styles.filters}>
					{["All", "Nearby", "Food", "Parks", "Shops"].map((f, i) => (
						<View
							key={f}
							style={[styles.filterChip, i === 0 && styles.filterChipActive]}
						>
							<Text
								style={[styles.filterText, i === 0 && styles.filterTextActive]}
							>
								{f}
							</Text>
						</View>
					))}
				</View>

				{/* Results */}
				<Transition.ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					<Text style={styles.resultsLabel}>
						{RESULTS.length} results for "golden"
					</Text>
					{RESULTS.map((result) => (
						<View key={result.id} style={styles.resultCard}>
							<View
								style={[
									styles.resultIcon,
									{ backgroundColor: result.iconBg + "20" },
								]}
							>
								<Ionicons name={result.icon} size={20} color={result.iconBg} />
							</View>
							<View style={styles.resultInfo}>
								<Text style={styles.resultTitle}>{result.title}</Text>
								<Text style={styles.resultSubtitle}>{result.subtitle}</Text>
							</View>
							<Text style={styles.resultDistance}>{result.distance}</Text>
						</View>
					))}
				</Transition.ScrollView>

				{/* Bottom Handle */}
				<View style={styles.handleArea}>
					<View style={styles.handle} />
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	sheet: {
		flex: 1,
		backgroundColor: "#0D0D1A",
		borderBottomLeftRadius: 28,
		borderBottomRightRadius: 28,
	},
	searchHeader: {
		paddingHorizontal: 20,
		paddingBottom: 12,
	},
	searchBar: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255,255,255,0.08)",
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 12,
		gap: 10,
	},
	searchText: {
		flex: 1,
		fontSize: 17,
		fontWeight: "700",
		color: "#fff",
	},
	clearBtn: {
		padding: 2,
	},
	filters: {
		flexDirection: "row",
		paddingHorizontal: 20,
		gap: 8,
		marginBottom: 12,
	},
	filterChip: {
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 8,
	},
	filterChipActive: {
		backgroundColor: "#6C5CE720",
	},
	filterText: {
		fontSize: 13,
		fontWeight: "700",
		color: "rgba(255,255,255,0.4)",
	},
	filterTextActive: {
		color: "#6C5CE7",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingBottom: 8,
	},
	resultsLabel: {
		fontSize: 12,
		fontWeight: "700",
		color: "rgba(255,255,255,0.25)",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: 12,
	},
	resultCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255,255,255,0.04)",
		borderRadius: 18,
		padding: 14,
		marginBottom: 8,
		gap: 12,
	},
	resultIcon: {
		width: 44,
		height: 44,
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
	},
	resultInfo: {
		flex: 1,
	},
	resultTitle: {
		fontSize: 15,
		fontWeight: "800",
		color: "#fff",
		marginBottom: 2,
	},
	resultSubtitle: {
		fontSize: 13,
		fontWeight: "500",
		color: "rgba(255,255,255,0.4)",
	},
	resultDistance: {
		fontSize: 13,
		fontWeight: "700",
		color: "rgba(255,255,255,0.3)",
	},
	handleArea: {
		alignItems: "center",
		paddingVertical: 12,
	},
	handle: {
		width: 44,
		height: 5,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 3,
	},
});
