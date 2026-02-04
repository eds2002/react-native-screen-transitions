import { Ionicons } from "@expo/vector-icons";
import {
	Dimensions,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_SNAP = 1.0;
const MAX_WIDTH = SCREEN_WIDTH * MAX_SNAP;

const CATEGORIES = [
	{ label: "Italian", icon: "pizza" as const, color: "#E84393" },
	{ label: "Japanese", icon: "fish" as const, color: "#6C5CE7" },
	{ label: "Mexican", icon: "flame" as const, color: "#FDCB6E" },
	{ label: "Indian", icon: "leaf" as const, color: "#00B894" },
	{ label: "Thai", icon: "nutrition" as const, color: "#FF6B6B" },
	{ label: "Korean", icon: "bonfire" as const, color: "#74B9FF" },
];

const FILTERS = [
	{
		title: "Sort By",
		options: ["Recommended", "Distance", "Rating", "Price"],
		active: 0,
	},
	{
		title: "Price Range",
		options: ["$", "$$", "$$$", "$$$$"],
		active: -1,
	},
	{
		title: "Dietary",
		options: ["Vegetarian", "Vegan", "Gluten-Free", "Halal"],
		active: -1,
	},
];

export default function HorizontalDrawerScreen() {
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.container, { maxWidth: MAX_WIDTH }]}>
			{/* Vertical handle on left edge */}
			<View style={styles.handleBar}>
				<View style={styles.handle} />
			</View>

			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={[
					styles.content,
					{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
				]}
				showsVerticalScrollIndicator={false}
			>
				<Text style={styles.title}>Filters</Text>
				<Text style={styles.subtitle}>Refine your search</Text>

				{/* Category Grid */}
				<Text style={styles.sectionTitle}>Cuisine</Text>
				<View style={styles.categoryGrid}>
					{CATEGORIES.map((cat) => (
						<Pressable key={cat.label} style={styles.categoryCard}>
							<View
								style={[
									styles.categoryIcon,
									{ backgroundColor: cat.color + "20" },
								]}
							>
								<Ionicons name={cat.icon} size={24} color={cat.color} />
							</View>
							<Text style={styles.categoryLabel}>{cat.label}</Text>
						</Pressable>
					))}
				</View>

				{/* Filter Groups */}
				{FILTERS.map((filter) => (
					<View key={filter.title} style={styles.filterGroup}>
						<Text style={styles.sectionTitle}>{filter.title}</Text>
						<View style={styles.filterOptions}>
							{filter.options.map((option, idx) => (
								<Pressable
									key={option}
									style={[
										styles.filterChip,
										idx === filter.active && styles.filterChipActive,
									]}
								>
									<Text
										style={[
											styles.filterChipText,
											idx === filter.active && styles.filterChipTextActive,
										]}
									>
										{option}
									</Text>
								</Pressable>
							))}
						</View>
					</View>
				))}

				{/* Distance Slider (visual only) */}
				<Text style={styles.sectionTitle}>Distance</Text>
				<View style={styles.distanceCard}>
					<View style={styles.distanceBar}>
						<View style={styles.distanceFill} />
						<View style={styles.distanceThumb} />
					</View>
					<View style={styles.distanceLabels}>
						<Text style={styles.distanceLabel}>0.5 mi</Text>
						<Text style={styles.distanceLabelActive}>2.5 mi</Text>
						<Text style={styles.distanceLabel}>10 mi</Text>
					</View>
				</View>

				{/* Rating */}
				<Text style={styles.sectionTitle}>Minimum Rating</Text>
				<View style={styles.ratingRow}>
					{[1, 2, 3, 4, 5].map((star) => (
						<Pressable key={star} style={styles.starButton}>
							<Ionicons
								name={star <= 4 ? "star" : "star-outline"}
								size={28}
								color={star <= 4 ? "#FDCB6E" : "rgba(255,255,255,0.15)"}
							/>
						</Pressable>
					))}
				</View>

				{/* Apply Button */}
				<View style={styles.applyButton}>
					<Text style={styles.applyText}>Apply Filters</Text>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "row",
		backgroundColor: "#0D0D1A",
		borderTopLeftRadius: 28,
		borderBottomLeftRadius: 28,
	},
	handleBar: {
		width: 24,
		justifyContent: "center",
		alignItems: "center",
	},
	handle: {
		width: 5,
		height: 44,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 3,
	},
	content: {
		paddingHorizontal: 20,
		paddingLeft: 4,
	},
	title: {
		fontSize: 32,
		fontWeight: "900",
		color: "#fff",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 15,
		fontWeight: "600",
		color: "rgba(255,255,255,0.35)",
		marginBottom: 28,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "rgba(255,255,255,0.8)",
		marginBottom: 12,
	},
	categoryGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		marginBottom: 28,
	},
	categoryCard: {
		width: "30%",
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 18,
		padding: 14,
		alignItems: "center",
		gap: 8,
	},
	categoryIcon: {
		width: 48,
		height: 48,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
	},
	categoryLabel: {
		fontSize: 13,
		fontWeight: "700",
		color: "rgba(255,255,255,0.7)",
	},
	filterGroup: {
		marginBottom: 24,
	},
	filterOptions: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	filterChip: {
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 14,
		paddingHorizontal: 18,
		paddingVertical: 10,
		borderWidth: 1.5,
		borderColor: "transparent",
	},
	filterChipActive: {
		backgroundColor: "#6C5CE720",
		borderColor: "#6C5CE7",
	},
	filterChipText: {
		fontSize: 14,
		fontWeight: "700",
		color: "rgba(255,255,255,0.5)",
	},
	filterChipTextActive: {
		color: "#6C5CE7",
	},
	distanceCard: {
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 18,
		padding: 20,
		marginBottom: 28,
	},
	distanceBar: {
		height: 6,
		backgroundColor: "rgba(255,255,255,0.1)",
		borderRadius: 3,
		marginBottom: 12,
	},
	distanceFill: {
		position: "absolute",
		left: 0,
		top: 0,
		bottom: 0,
		width: "35%",
		backgroundColor: "#00B894",
		borderRadius: 3,
	},
	distanceThumb: {
		position: "absolute",
		left: "33%",
		top: -7,
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: "#00B894",
		borderWidth: 3,
		borderColor: "#0D0D1A",
	},
	distanceLabels: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	distanceLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "rgba(255,255,255,0.3)",
	},
	distanceLabelActive: {
		fontSize: 12,
		fontWeight: "800",
		color: "#00B894",
	},
	ratingRow: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 32,
	},
	starButton: {
		width: 48,
		height: 48,
		borderRadius: 16,
		backgroundColor: "rgba(255,255,255,0.06)",
		justifyContent: "center",
		alignItems: "center",
	},
	applyButton: {
		backgroundColor: "#6C5CE7",
		borderRadius: 20,
		paddingVertical: 18,
		alignItems: "center",
	},
	applyText: {
		fontSize: 17,
		fontWeight: "900",
		color: "#fff",
	},
});
