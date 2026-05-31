import { StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

const COMMENTS = Array.from({ length: 25 }, (_, i) => ({
	id: i + 1,
	user: `user_${1000 + i}`,
	text: `This is comment number ${i + 1}. Great content! 🔥`,
	likes: Math.floor(Math.random() * 100),
}));

/**
 * Instagram-style sheet with sheetScrollGestureBehavior: "collapse-only".
 *
 * Via handle/header:
 * - ↓ collapses, ↑ expands
 *
 * Via ScrollView:
 * - ↓ collapses (at top) or scrolls
 * - ↑ ALWAYS scrolls (never expands from ScrollView)
 */
export default function InstagramSheet() {
	const theme = useTheme();

	return (
		<View style={styles.container}>
			<View style={[styles.sheet, { backgroundColor: theme.card }]}>
				<View style={[styles.handle, { backgroundColor: theme.handle }]} />
				<ScreenHeader
					title="Comments"
					subtitle='sheetScrollGestureBehavior: "collapse-only"'
				/>

				<View style={[styles.deadspaceBox, { backgroundColor: theme.infoBox }]}>
					<Text style={[styles.deadspaceTitle, { color: theme.text }]}>
						Deadspace Zone
					</Text>
					<Text style={[styles.deadspaceText, { color: theme.textSecondary }]}>
						Swipe ↑ from here to expand, ↓ to collapse
					</Text>
				</View>

				<View style={[styles.divider, { backgroundColor: theme.separator }]} />

				<View
					style={[
						styles.scrollLabel,
						{ backgroundColor: theme.surfaceElevated },
					]}
				>
					<Text
						style={[styles.scrollLabelText, { color: theme.textSecondary }]}
					>
						ScrollView below - ↑ will SCROLL, not expand
					</Text>
				</View>

				<Transition.ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
				>
					<View
						style={[styles.boundaryMarker, { backgroundColor: theme.noteBox }]}
					>
						<Text style={[styles.boundaryText, { color: theme.noteText }]}>
							Scroll Top (boundary)
						</Text>
						<Text
							style={[styles.boundarySubtext, { color: theme.textSecondary }]}
						>
							↓ from here collapses, ↑ scrolls (no expand)
						</Text>
					</View>

					{COMMENTS.map((comment) => (
						<View key={comment.id} style={styles.comment}>
							<View
								style={[
									styles.avatar,
									{ backgroundColor: theme.surfaceElevated },
								]}
							>
								<Text style={[styles.avatarText, { color: theme.activePill }]}>
									{comment.user.slice(0, 1).toUpperCase()}
								</Text>
							</View>
							<View style={styles.commentContent}>
								<Text style={[styles.commentUser, { color: theme.text }]}>
									{comment.user}
								</Text>
								<Text
									style={[styles.commentText, { color: theme.textSecondary }]}
								>
									{comment.text}
								</Text>
								<Text
									style={[styles.commentLikes, { color: theme.textTertiary }]}
								>
									♥ {comment.likes} likes
								</Text>
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
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingTop: 12,
		flex: 1,
	},
	handle: {
		width: 40,
		height: 4,
		borderRadius: 2,
		alignSelf: "center",
		marginBottom: 8,
	},
	deadspaceBox: {
		marginHorizontal: 16,
		marginBottom: 12,
		borderRadius: 14,
		padding: 12,
	},
	deadspaceTitle: {
		fontSize: 12,
		fontWeight: "600",
	},
	deadspaceText: {
		fontSize: 11,
		marginTop: 2,
	},
	divider: {
		height: 1,
		marginHorizontal: 16,
	},
	scrollLabel: {
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	scrollLabelText: {
		fontSize: 11,
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
		borderRadius: 14,
		padding: 12,
	},
	boundaryText: {
		fontSize: 13,
		fontWeight: "600",
	},
	boundarySubtext: {
		fontSize: 11,
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
		justifyContent: "center",
		alignItems: "center",
	},
	avatarText: {
		fontSize: 14,
		fontWeight: "600",
	},
	commentContent: {
		flex: 1,
	},
	commentUser: {
		fontSize: 13,
		fontWeight: "600",
	},
	commentText: {
		fontSize: 13,
		marginTop: 2,
		lineHeight: 18,
	},
	commentLikes: {
		fontSize: 11,
		marginTop: 4,
	},
});
