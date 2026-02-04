import { Ionicons } from "@expo/vector-icons";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SNAP = 0.8;
const MAX_HEIGHT = SCREEN_HEIGHT * MAX_SNAP;

const COMMENTS = [
	{
		id: 1,
		name: "Sarah Chen",
		avatar: "S",
		avatarBg: "#E84393",
		comment:
			"This is absolutely stunning! The lighting in this shot is perfect 😍",
		likes: 42,
		time: "2h",
		replies: 3,
	},
	{
		id: 2,
		name: "Marcus Rivera",
		avatar: "M",
		avatarBg: "#6C5CE7",
		comment: "Where was this taken? I need to add this to my travel list ASAP!",
		likes: 18,
		time: "3h",
		replies: 1,
	},
	{
		id: 3,
		name: "Yuki Tanaka",
		avatar: "Y",
		avatarBg: "#00B894",
		comment: "Your composition skills are next level. Teach me your ways! 🙌",
		likes: 31,
		time: "4h",
		replies: 0,
	},
	{
		id: 4,
		name: "Emma Watson",
		avatar: "E",
		avatarBg: "#FDCB6E",
		comment:
			"I've been following your work for months. Every single post is a masterpiece.",
		likes: 67,
		time: "5h",
		replies: 5,
	},
	{
		id: 5,
		name: "Alex Kim",
		avatar: "A",
		avatarBg: "#74B9FF",
		comment: "What camera setup are you using? The dynamic range is insane.",
		likes: 24,
		time: "6h",
		replies: 2,
	},
	{
		id: 6,
		name: "Luna Garcia",
		avatar: "L",
		avatarBg: "#FF6B6B",
		comment: "The colors 🎨 Just wow. How do you get that teal/orange grade?",
		likes: 55,
		time: "7h",
		replies: 4,
	},
	{
		id: 7,
		name: "David Park",
		avatar: "D",
		avatarBg: "#A29BFE",
		comment:
			"This gives me major Blade Runner vibes! Cyberpunk photography at its finest.",
		likes: 89,
		time: "8h",
		replies: 7,
	},
	{
		id: 8,
		name: "Mia Johnson",
		avatar: "M",
		avatarBg: "#FD79A8",
		comment: "Saved this for inspo. Hope you don't mind! 🔖",
		likes: 12,
		time: "9h",
		replies: 1,
	},
	{
		id: 9,
		name: "James Lee",
		avatar: "J",
		avatarBg: "#55EFC4",
		comment:
			"Can you do a behind-the-scenes reel? Would love to see the process.",
		likes: 33,
		time: "10h",
		replies: 0,
	},
	{
		id: 10,
		name: "Olivia Brown",
		avatar: "O",
		avatarBg: "#FFEAA7",
		comment: "This is gallery-worthy. Have you considered selling prints?",
		likes: 45,
		time: "11h",
		replies: 2,
	},
];

export default function WithScrollScreen() {
	return (
		<View style={styles.container}>
			<View style={[styles.sheet, { maxHeight: MAX_HEIGHT }]}>
				<View style={styles.handle} />

				<View style={styles.header}>
					<Text style={styles.title}>Comments</Text>
					<Text style={styles.count}>2,847</Text>
				</View>

				<Transition.ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					{COMMENTS.map((comment) => (
						<View key={comment.id} style={styles.commentCard}>
							<View style={styles.commentTop}>
								<View
									style={[styles.avatar, { backgroundColor: comment.avatarBg }]}
								>
									<Text style={styles.avatarText}>{comment.avatar}</Text>
								</View>
								<View style={styles.commentMeta}>
									<Text style={styles.commentName}>{comment.name}</Text>
									<Text style={styles.commentTime}>{comment.time}</Text>
								</View>
							</View>
							<Text style={styles.commentText}>{comment.comment}</Text>
							<View style={styles.commentActions}>
								<View style={styles.likeBtn}>
									<Ionicons name="heart" size={14} color="#E84393" />
									<Text style={styles.likeCount}>{comment.likes}</Text>
								</View>
								{comment.replies > 0 && (
									<Text style={styles.replyCount}>
										{comment.replies}{" "}
										{comment.replies === 1 ? "reply" : "replies"}
									</Text>
								)}
							</View>
						</View>
					))}
				</Transition.ScrollView>

				{/* Input bar */}
				<View style={styles.inputBar}>
					<View style={styles.inputAvatar}>
						<Ionicons name="person" size={16} color="rgba(255,255,255,0.4)" />
					</View>
					<View style={styles.inputField}>
						<Text style={styles.inputPlaceholder}>Add a comment...</Text>
					</View>
					<View style={styles.sendBtn}>
						<Ionicons name="send" size={16} color="#6C5CE7" />
					</View>
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
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
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
	header: {
		flexDirection: "row",
		alignItems: "baseline",
		paddingHorizontal: 20,
		marginBottom: 16,
		gap: 8,
	},
	title: {
		fontSize: 24,
		fontWeight: "900",
		color: "#fff",
	},
	count: {
		fontSize: 16,
		fontWeight: "700",
		color: "rgba(255,255,255,0.3)",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingBottom: 16,
	},
	commentCard: {
		backgroundColor: "rgba(255,255,255,0.04)",
		borderRadius: 18,
		padding: 16,
		marginBottom: 8,
	},
	commentTop: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 10,
	},
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
	},
	avatarText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#fff",
	},
	commentMeta: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	commentName: {
		fontSize: 14,
		fontWeight: "800",
		color: "#fff",
	},
	commentTime: {
		fontSize: 12,
		fontWeight: "600",
		color: "rgba(255,255,255,0.25)",
	},
	commentText: {
		fontSize: 14,
		fontWeight: "500",
		color: "rgba(255,255,255,0.65)",
		lineHeight: 21,
		marginBottom: 10,
	},
	commentActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
	},
	likeBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	likeCount: {
		fontSize: 12,
		fontWeight: "700",
		color: "rgba(255,255,255,0.4)",
	},
	replyCount: {
		fontSize: 12,
		fontWeight: "600",
		color: "rgba(255,255,255,0.25)",
	},
	inputBar: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		gap: 10,
		borderTopWidth: 1,
		borderTopColor: "rgba(255,255,255,0.06)",
	},
	inputAvatar: {
		width: 32,
		height: 32,
		borderRadius: 11,
		backgroundColor: "rgba(255,255,255,0.06)",
		justifyContent: "center",
		alignItems: "center",
	},
	inputField: {
		flex: 1,
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 10,
	},
	inputPlaceholder: {
		fontSize: 14,
		fontWeight: "600",
		color: "rgba(255,255,255,0.25)",
	},
	sendBtn: {
		width: 36,
		height: 36,
		borderRadius: 12,
		backgroundColor: "rgba(108,92,231,0.15)",
		justifyContent: "center",
		alignItems: "center",
	},
});
