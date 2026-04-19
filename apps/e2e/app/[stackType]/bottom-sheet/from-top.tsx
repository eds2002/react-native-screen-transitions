import { Ionicons } from "@expo/vector-icons";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SNAP = 1.0;
const MAX_HEIGHT = SCREEN_HEIGHT * MAX_SNAP;

const NOTIFICATIONS = [
	{
		id: 1,
		app: "Messages",
		icon: "chatbubble-ellipses" as const,
		iconColor: "#00B894",
		iconBg: "#00B89420",
		title: "Sarah Chen",
		body: "Are we still on for dinner tonight? I found this amazing new place 🍣",
		time: "2m ago",
	},
	{
		id: 2,
		app: "Instagram",
		icon: "heart" as const,
		iconColor: "#E84393",
		iconBg: "#E8439320",
		title: "New Likes",
		body: "alex_design and 42 others liked your photo",
		time: "5m ago",
	},
	{
		id: 3,
		app: "Calendar",
		icon: "calendar" as const,
		iconColor: "#6C5CE7",
		iconBg: "#6C5CE720",
		title: "Team Standup",
		body: "Starting in 15 minutes · Zoom",
		time: "12m ago",
	},
	{
		id: 4,
		app: "Wallet",
		icon: "card" as const,
		iconColor: "#FDCB6E",
		iconBg: "#FDCB6E20",
		title: "Payment Received",
		body: "$1,250.00 from Acme Corp deposited",
		time: "28m ago",
	},
	{
		id: 5,
		app: "Weather",
		icon: "thunderstorm" as const,
		iconColor: "#74B9FF",
		iconBg: "#74B9FF20",
		title: "Severe Weather Alert",
		body: "Thunderstorm warning until 8:00 PM",
		time: "45m ago",
	},
];

export default function FromTopScreen() {
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.container, { maxHeight: MAX_HEIGHT }]}>
			{/* Content anchored to bottom for inverted sheet */}
			<View style={styles.contentWrapper}>
				{/* Date header */}
				<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
					<Text style={styles.dateText}>Monday, Jan 27</Text>
					<Text style={styles.title}>Notifications</Text>
				</View>

				{/* Notification list */}
				<View style={styles.list}>
					{NOTIFICATIONS.map((notif) => (
						<View key={notif.id} style={styles.notifCard}>
							<View style={styles.notifHeader}>
								<View
									style={[styles.notifIcon, { backgroundColor: notif.iconBg }]}
								>
									<Ionicons
										name={notif.icon}
										size={20}
										color={notif.iconColor}
									/>
								</View>
								<Text style={styles.notifApp}>{notif.app}</Text>
								<Text style={styles.notifTime}>{notif.time}</Text>
							</View>
							<Text style={styles.notifTitle}>{notif.title}</Text>
							<Text style={styles.notifBody}>{notif.body}</Text>
						</View>
					))}
				</View>

				{/* Bottom handle */}
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
		backgroundColor: "#0D0D1A",
		borderBottomLeftRadius: 28,
		borderBottomRightRadius: 28,
	},
	contentWrapper: {
		flex: 1,
		justifyContent: "flex-end",
	},
	header: {
		paddingHorizontal: 20,
		marginBottom: 16,
	},
	dateText: {
		fontSize: 14,
		fontWeight: "700",
		color: "rgba(255,255,255,0.35)",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 4,
	},
	title: {
		fontSize: 34,
		fontWeight: "900",
		color: "#fff",
	},
	list: {
		paddingHorizontal: 20,
		gap: 10,
	},
	notifCard: {
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 20,
		padding: 16,
	},
	notifHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
		gap: 10,
	},
	notifIcon: {
		width: 36,
		height: 36,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
	},
	notifApp: {
		fontSize: 13,
		fontWeight: "700",
		color: "rgba(255,255,255,0.5)",
		flex: 1,
	},
	notifTime: {
		fontSize: 12,
		fontWeight: "600",
		color: "rgba(255,255,255,0.25)",
	},
	notifTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#fff",
		marginBottom: 4,
	},
	notifBody: {
		fontSize: 14,
		fontWeight: "500",
		color: "rgba(255,255,255,0.55)",
		lineHeight: 20,
	},
	handleArea: {
		alignItems: "center",
		paddingVertical: 14,
	},
	handle: {
		width: 44,
		height: 5,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 3,
	},
});
