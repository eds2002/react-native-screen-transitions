import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { router } from "expo-router";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { buildStackPath, useResolvedStackType } from "@/components/stack-examples/stack-routing";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SNAP = 0.9;
const MAX_HEIGHT = SCREEN_HEIGHT * MAX_SNAP;

export default function WithResistanceScreen() {
	const stackType = useResolvedStackType();
	return (
		<MaskedView
			style={StyleSheet.absoluteFill}
			maskElement={
				<Transition.View
					styleId="MASKED"
					style={{ flex: 1 }}
					pointerEvents="none"
				/>
			}
			pointerEvents="box-none"
		>
			<Transition.View styleId="CONTENT" style={styles.container}>
				<View style={{ maxHeight: MAX_HEIGHT }}>
					<View style={styles.handle} />

					{/* Hero Image Placeholder */}
					<View style={styles.heroImage}>
						<Ionicons
							name="restaurant"
							size={48}
							color="rgba(255,255,255,0.3)"
						/>
						<View style={styles.heroOverlay}>
							<View style={styles.ratingBadge}>
								<Ionicons name="star" size={14} color="#FDCB6E" />
								<Text style={styles.ratingText}>4.8</Text>
							</View>
						</View>
					</View>

					{/* Place Info */}
					<View style={styles.infoSection}>
						<Text style={styles.placeName}>Sakura Omakase</Text>
						<Text style={styles.placeCategory}>Japanese · $$$$ · 0.3 mi</Text>

						{/* Tags */}
						<View style={styles.tags}>
							{["Michelin ⭐", "Omakase", "Date Night"].map((tag) => (
								<View key={tag} style={styles.tag}>
									<Text style={styles.tagText}>{tag}</Text>
								</View>
							))}
						</View>

						{/* Quick Actions */}
						<View style={styles.actions}>
							<Pressable style={styles.actionPrimary}>
								<Ionicons name="navigate" size={18} color="#fff" />
								<Text style={styles.actionPrimaryText}>Directions</Text>
							</Pressable>
							<Pressable style={styles.actionSecondary}>
								<Ionicons name="call" size={18} color="#00B894" />
							</Pressable>
							<Pressable style={styles.actionSecondary}>
								<Ionicons name="share-outline" size={18} color="#74B9FF" />
							</Pressable>
						</View>

						{/* Hours */}
						<View style={styles.hoursRow}>
							<Ionicons name="time-outline" size={16} color="#00B894" />
							<Text style={styles.hoursOpen}>Open</Text>
							<Text style={styles.hoursDetail}>· Closes 10:00 PM</Text>
						</View>

						{/* Push to full detail */}
						<Pressable
							style={styles.detailButton}
							onPress={() => router.push(buildStackPath(stackType, "bottom-sheet/normal"))}
						>
							<Text style={styles.detailButtonText}>View Full Details</Text>
							<Ionicons
								name="chevron-forward"
								size={18}
								color="rgba(255,255,255,0.5)"
							/>
						</Pressable>
					</View>
				</View>
			</Transition.View>
		</MaskedView>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		height: "100%",
		backgroundColor: "#0D0D1A",
		paddingTop: 12,
	},
	handle: {
		width: 44,
		height: 5,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 3,
		alignSelf: "center",
		marginBottom: 16,
	},
	heroImage: {
		height: 180,
		marginHorizontal: 20,
		borderRadius: 24,
		backgroundColor: "rgba(255,255,255,0.06)",
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},
	heroOverlay: {
		position: "absolute",
		bottom: 12,
		right: 12,
	},
	ratingBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.7)",
		borderRadius: 12,
		paddingHorizontal: 10,
		paddingVertical: 6,
		gap: 4,
	},
	ratingText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#fff",
	},
	infoSection: {
		padding: 20,
	},
	placeName: {
		fontSize: 28,
		fontWeight: "900",
		color: "#fff",
		marginBottom: 4,
	},
	placeCategory: {
		fontSize: 15,
		fontWeight: "600",
		color: "rgba(255,255,255,0.4)",
		marginBottom: 16,
	},
	tags: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 20,
	},
	tag: {
		backgroundColor: "rgba(255,255,255,0.08)",
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 8,
	},
	tagText: {
		fontSize: 13,
		fontWeight: "700",
		color: "rgba(255,255,255,0.7)",
	},
	actions: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 20,
	},
	actionPrimary: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#00B894",
		borderRadius: 16,
		paddingVertical: 14,
		gap: 8,
	},
	actionPrimaryText: {
		fontSize: 16,
		fontWeight: "800",
		color: "#fff",
	},
	actionSecondary: {
		width: 52,
		height: 52,
		borderRadius: 16,
		backgroundColor: "rgba(255,255,255,0.06)",
		justifyContent: "center",
		alignItems: "center",
	},
	hoursRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginBottom: 20,
	},
	hoursOpen: {
		fontSize: 14,
		fontWeight: "800",
		color: "#00B894",
	},
	hoursDetail: {
		fontSize: 14,
		fontWeight: "600",
		color: "rgba(255,255,255,0.4)",
	},
	detailButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 16,
		padding: 16,
	},
	detailButtonText: {
		fontSize: 16,
		fontWeight: "700",
		color: "rgba(255,255,255,0.7)",
	},
});
