import { Ionicons } from "@expo/vector-icons";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_SNAP = 0.8;
const MAX_WIDTH = SCREEN_WIDTH * MAX_SNAP;

const NAV_ITEMS = [
	{
		section: "Main",
		items: [
			{ icon: "home" as const, label: "Home", color: "#6C5CE7", badge: null },
			{
				icon: "search" as const,
				label: "Explore",
				color: "#74B9FF",
				badge: null,
			},
			{
				icon: "notifications" as const,
				label: "Notifications",
				color: "#FDCB6E",
				badge: "12",
			},
			{
				icon: "mail" as const,
				label: "Messages",
				color: "#00B894",
				badge: "3",
			},
		],
	},
	{
		section: "Content",
		items: [
			{
				icon: "bookmark" as const,
				label: "Saved",
				color: "#E84393",
				badge: null,
			},
			{
				icon: "heart" as const,
				label: "Favorites",
				color: "#FF6B6B",
				badge: null,
			},
			{
				icon: "time" as const,
				label: "History",
				color: "#A29BFE",
				badge: null,
			},
			{
				icon: "download" as const,
				label: "Downloads",
				color: "#55EFC4",
				badge: "2",
			},
		],
	},
	{
		section: "Account",
		items: [
			{
				icon: "person" as const,
				label: "Profile",
				color: "#FD79A8",
				badge: null,
			},
			{
				icon: "settings" as const,
				label: "Settings",
				color: "#B2BEC3",
				badge: null,
			},
			{
				icon: "help-circle" as const,
				label: "Help",
				color: "#DFE6E9",
				badge: null,
			},
		],
	},
];

export default function WithScrollHorizontalInvertedScreen() {
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.container, { maxWidth: MAX_WIDTH }]}>
			<View
				style={[
					styles.content,
					{
						paddingTop: insets.top + 12,
						paddingBottom: insets.bottom + 12,
					},
				]}
			>
				{/* User Profile Header */}
				<View style={styles.profileSection}>
					<View style={styles.avatarLarge}>
						<Text style={styles.avatarText}>JD</Text>
					</View>
					<View style={styles.profileInfo}>
						<Text style={styles.profileName}>Jane Doe</Text>
						<Text style={styles.profileHandle}>@janedoe</Text>
					</View>
				</View>

				{/* Stats */}
				<View style={styles.statsRow}>
					<View style={styles.statItem}>
						<Text style={styles.statValue}>12.4k</Text>
						<Text style={styles.statLabel}>Followers</Text>
					</View>
					<View style={styles.statItem}>
						<Text style={styles.statValue}>847</Text>
						<Text style={styles.statLabel}>Following</Text>
					</View>
					<View style={styles.statItem}>
						<Text style={styles.statValue}>3.2k</Text>
						<Text style={styles.statLabel}>Posts</Text>
					</View>
				</View>

				{/* Navigation */}
				<Transition.ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					{NAV_ITEMS.map((section) => (
						<View key={section.section} style={styles.navSection}>
							<Text style={styles.sectionTitle}>{section.section}</Text>
							{section.items.map((item) => (
								<Pressable key={item.label} style={styles.navItem}>
									<View
										style={[
											styles.navIcon,
											{ backgroundColor: item.color + "20" },
										]}
									>
										<Ionicons name={item.icon} size={20} color={item.color} />
									</View>
									<Text style={styles.navLabel}>{item.label}</Text>
									{item.badge && (
										<View style={styles.badge}>
											<Text style={styles.badgeText}>{item.badge}</Text>
										</View>
									)}
									<Ionicons
										name="chevron-forward"
										size={16}
										color="rgba(255,255,255,0.15)"
									/>
								</Pressable>
							))}
						</View>
					))}
				</Transition.ScrollView>

				{/* Logout */}
				<Pressable style={styles.logoutBtn}>
					<Ionicons name="log-out-outline" size={18} color="#FF6B6B" />
					<Text style={styles.logoutText}>Log Out</Text>
				</Pressable>
			</View>

			{/* Handle on right edge */}
			<View style={styles.handleBar}>
				<View style={styles.handle} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "row",
		backgroundColor: "#0D0D1A",
		borderTopRightRadius: 28,
		borderBottomRightRadius: 28,
	},
	content: {
		flex: 1,
		paddingLeft: 20,
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
	profileSection: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		marginBottom: 20,
	},
	avatarLarge: {
		width: 56,
		height: 56,
		borderRadius: 20,
		backgroundColor: "#6C5CE7",
		justifyContent: "center",
		alignItems: "center",
	},
	avatarText: {
		fontSize: 20,
		fontWeight: "900",
		color: "#fff",
	},
	profileInfo: {
		flex: 1,
	},
	profileName: {
		fontSize: 22,
		fontWeight: "900",
		color: "#fff",
	},
	profileHandle: {
		fontSize: 14,
		fontWeight: "600",
		color: "rgba(255,255,255,0.35)",
		marginTop: 2,
	},
	statsRow: {
		flexDirection: "row",
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 18,
		padding: 16,
		marginBottom: 20,
		marginRight: 16,
	},
	statItem: {
		flex: 1,
		alignItems: "center",
	},
	statValue: {
		fontSize: 18,
		fontWeight: "900",
		color: "#fff",
	},
	statLabel: {
		fontSize: 11,
		fontWeight: "700",
		color: "rgba(255,255,255,0.3)",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginTop: 2,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingRight: 16,
		paddingBottom: 8,
	},
	navSection: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: "800",
		color: "rgba(255,255,255,0.25)",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 10,
	},
	navItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
		gap: 12,
	},
	navIcon: {
		width: 40,
		height: 40,
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
	},
	navLabel: {
		flex: 1,
		fontSize: 16,
		fontWeight: "700",
		color: "rgba(255,255,255,0.8)",
	},
	badge: {
		backgroundColor: "#E84393",
		borderRadius: 10,
		paddingHorizontal: 8,
		paddingVertical: 3,
		marginRight: 4,
	},
	badgeText: {
		fontSize: 11,
		fontWeight: "800",
		color: "#fff",
	},
	logoutBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 14,
		marginRight: 16,
		backgroundColor: "rgba(255,107,107,0.08)",
		borderRadius: 16,
	},
	logoutText: {
		fontSize: 15,
		fontWeight: "700",
		color: "#FF6B6B",
	},
});
