import { StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

const COMMENTS = Array.from({ length: 25 }, (_, i) => ({
	id: i + 1,
	user: `user_${1000 + i}`,
	text: `This is comment number ${i + 1}. Great content! 🔥`,
	likes: Math.floor(Math.random() * 100),
}));

/**
 * Instagram-style sheet with expandViaScrollView: false.
 *
 * Via handle/header:
 * - ↓ collapses, ↑ expands
 *
 * Via ScrollView:
 * - ↓ collapses (at top) or scrolls
 * - ↑ ALWAYS scrolls (never expands from ScrollView)
 */
export default function InstagramSheet() {
	return (
		<View style={styles.container}>
			<View style={styles.sheet}>
				<View style={styles.handle} />
				<ScreenHeader title="Comments" subtitle="expandViaScrollView: false" />

				<View style={styles.deadspaceBox}>
					<Text style={styles.deadspaceTitle}>Deadspace Zone</Text>
					<Text style={styles.deadspaceText}>
						Swipe ↑ from here to expand, ↓ to collapse
					</Text>
				</View>

				<View style={styles.divider} />

				<View style={styles.scrollLabel}>
					<Text style={styles.scrollLabelText}>
						ScrollView below - ↑ will SCROLL, not expand
					</Text>
				</View>

				<Transition.ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
				>
					<View style={styles.boundaryMarker}>
						<Text style={styles.boundaryText}>Scroll Top (boundary)</Text>
						<Text style={styles.boundarySubtext}>
							↓ from here collapses, ↑ scrolls (no expand)
						</Text>
					</View>

					{COMMENTS.map((comment) => (
						<View key={comment.id} style={styles.comment}>
							<View style={styles.avatar}>
								<Text style={styles.avatarText}>
									{comment.user.slice(0, 1).toUpperCase()}
								</Text>
							</View>
							<View style={styles.commentContent}>
								<Text style={styles.commentUser}>{comment.user}</Text>
								<Text style={styles.commentText}>{comment.text}</Text>
								<Text style={styles.commentLikes}>♥ {comment.likes} likes</Text>
							</View>
						</View>
					))}
				</Transition.ScrollView>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-end",
	},
	sheet: {
		backgroundColor: "#1a1a2e",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingTop: 12,
		flex: 1,
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		alignSelf: "center",
		marginBottom: 8,
	},
	deadspaceBox: {
		marginHorizontal: 16,
		marginBottom: 12,
		backgroundColor: "rgba(233, 30, 99, 0.15)",
		borderRadius: 12,
		padding: 12,
		borderWidth: 1,
		borderColor: "rgba(233, 30, 99, 0.4)",
		borderStyle: "dashed",
	},
	deadspaceTitle: {
		fontSize: 12,
		fontWeight: "600",
		color: "#e91e63",
	},
	deadspaceText: {
		fontSize: 11,
		color: "rgba(233, 30, 99, 0.8)",
		marginTop: 2,
	},
	divider: {
		height: 1,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		marginHorizontal: 16,
	},
	scrollLabel: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: "rgba(74, 158, 255, 0.1)",
	},
	scrollLabelText: {
		fontSize: 11,
		color: "#4a9eff",
		textAlign: "center",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		gap: 12,
	},
	boundaryMarker: {
		backgroundColor: "rgba(76, 175, 80, 0.2)",
		borderRadius: 12,
		padding: 12,
		borderWidth: 1,
		borderColor: "rgba(76, 175, 80, 0.5)",
	},
	boundaryText: {
		fontSize: 13,
		fontWeight: "600",
		color: "#4caf50",
	},
	boundarySubtext: {
		fontSize: 11,
		color: "rgba(76, 175, 80, 0.8)",
		marginTop: 2,
	},
	comment: {
		flexDirection: "row",
		gap: 12,
	},
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(233, 30, 99, 0.3)",
		justifyContent: "center",
		alignItems: "center",
	},
	avatarText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#e91e63",
	},
	commentContent: {
		flex: 1,
	},
	commentUser: {
		fontSize: 13,
		fontWeight: "600",
		color: "#fff",
	},
	commentText: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.7)",
		marginTop: 2,
		lineHeight: 18,
	},
	commentLikes: {
		fontSize: 11,
		color: "rgba(255, 255, 255, 0.4)",
		marginTop: 4,
	},
});
