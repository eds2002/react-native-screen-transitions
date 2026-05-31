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
import { useTheme } from "@/theme";

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

export function SideSheet({ side }: { side: "left" | "right" }) {
	const insets = useSafeAreaInsets();
	const theme = useTheme();
	const handleFirst = side === "right";

	const handle = (
		<View style={styles.handleBar}>
			<View style={[styles.handle, { backgroundColor: theme.handle }]} />
		</View>
	);

	return (
		<View
			style={[
				styles.container,
				side === "right" ? styles.rightSheet : styles.leftSheet,
				{ maxWidth: MAX_WIDTH, backgroundColor: theme.bg },
			]}
		>
			{handleFirst && handle}
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[
					styles.content,
					{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
					side === "right" ? styles.rightContent : styles.leftContent,
				]}
				showsVerticalScrollIndicator={false}
			>
				<Text style={[styles.title, { color: theme.text }]}>Filters</Text>
				<Text style={[styles.subtitle, { color: theme.textTertiary }]}>
					Refine your search
				</Text>

				<Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
					Cuisine
				</Text>
				<View style={styles.categoryGrid}>
					{CATEGORIES.map((cat) => (
						<Pressable
							key={cat.label}
							style={[styles.categoryCard, { backgroundColor: theme.card }]}
						>
							<View
								style={[
									styles.categoryIcon,
									{ backgroundColor: `${cat.color}20` },
								]}
							>
								<Ionicons name={cat.icon} size={24} color={cat.color} />
							</View>
							<Text
								style={[styles.categoryLabel, { color: theme.textSecondary }]}
							>
								{cat.label}
							</Text>
						</Pressable>
					))}
				</View>

				{FILTERS.map((filter) => (
					<View key={filter.title} style={styles.filterGroup}>
						<Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
							{filter.title}
						</Text>
						<View style={styles.filterOptions}>
							{filter.options.map((option, idx) => (
								<Pressable
									key={option}
									style={[
										styles.filterChip,
										{
											backgroundColor:
												idx === filter.active ? theme.activePill : theme.pill,
										},
									]}
								>
									<Text
										style={[
											styles.filterChipText,
											{
												color:
													idx === filter.active
														? theme.activePillText
														: theme.pillText,
											},
										]}
									>
										{option}
									</Text>
								</Pressable>
							))}
						</View>
					</View>
				))}

				<Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
					Distance
				</Text>
				<View style={[styles.distanceCard, { backgroundColor: theme.card }]}>
					<View
						style={[styles.distanceBar, { backgroundColor: theme.separator }]}
					>
						<View
							style={[
								styles.distanceFill,
								{ backgroundColor: theme.actionButton },
							]}
						/>
						<View
							style={[
								styles.distanceThumb,
								{
									backgroundColor: theme.actionButton,
									borderColor: theme.bg,
								},
							]}
						/>
					</View>
					<View style={styles.distanceLabels}>
						<Text style={[styles.distanceLabel, { color: theme.textTertiary }]}>
							0.5 mi
						</Text>
						<Text
							style={[
								styles.distanceLabelActive,
								{ color: theme.actionButton },
							]}
						>
							2.5 mi
						</Text>
						<Text style={[styles.distanceLabel, { color: theme.textTertiary }]}>
							10 mi
						</Text>
					</View>
				</View>

				<Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
					Minimum Rating
				</Text>
				<View style={styles.ratingRow}>
					{[1, 2, 3, 4, 5].map((star) => (
						<Pressable
							key={star}
							style={[styles.starButton, { backgroundColor: theme.card }]}
						>
							<Ionicons
								name={star <= 4 ? "star" : "star-outline"}
								size={28}
								color={star <= 4 ? "#FDCB6E" : theme.textTertiary}
							/>
						</Pressable>
					))}
				</View>

				<Pressable
					style={[styles.applyButton, { backgroundColor: theme.actionButton }]}
				>
					<Text style={[styles.applyText, { color: theme.actionButtonText }]}>
						Apply Filters
					</Text>
				</Pressable>
			</ScrollView>
			{!handleFirst && handle}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "row",
	},
	rightSheet: {
		borderTopLeftRadius: 28,
		borderBottomLeftRadius: 28,
	},
	leftSheet: {
		borderTopRightRadius: 28,
		borderBottomRightRadius: 28,
	},
	handleBar: {
		width: 24,
		justifyContent: "center",
		alignItems: "center",
	},
	handle: {
		width: 5,
		height: 44,
		borderRadius: 3,
	},
	scroll: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 20,
	},
	rightContent: {
		paddingLeft: 4,
	},
	leftContent: {
		paddingRight: 4,
	},
	title: {
		fontSize: 32,
		fontWeight: "900",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 15,
		fontWeight: "600",
		marginBottom: 28,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "800",
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
		borderRadius: 999,
		paddingHorizontal: 18,
		paddingVertical: 10,
	},
	filterChipText: {
		fontSize: 14,
		fontWeight: "700",
	},
	distanceCard: {
		borderRadius: 18,
		padding: 20,
		marginBottom: 28,
	},
	distanceBar: {
		height: 6,
		borderRadius: 3,
		marginBottom: 12,
	},
	distanceFill: {
		position: "absolute",
		left: 0,
		top: 0,
		bottom: 0,
		width: "35%",
		borderRadius: 3,
	},
	distanceThumb: {
		position: "absolute",
		left: "33%",
		top: -7,
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 3,
	},
	distanceLabels: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	distanceLabel: {
		fontSize: 12,
		fontWeight: "600",
	},
	distanceLabelActive: {
		fontSize: 12,
		fontWeight: "800",
	},
	ratingRow: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 28,
	},
	starButton: {
		flex: 1,
		aspectRatio: 1,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
	},
	applyButton: {
		borderRadius: 18,
		paddingVertical: 18,
		alignItems: "center",
		marginTop: 8,
	},
	applyText: {
		fontSize: 17,
		fontWeight: "800",
	},
});
