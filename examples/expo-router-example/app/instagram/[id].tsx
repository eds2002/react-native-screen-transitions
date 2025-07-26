import { router, useLocalSearchParams } from "expo-router";
import {
	Dimensions,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Transition, { Bounds } from "react-native-screen-transitions";
import { bakingPosts } from "./index";

const { width } = Dimensions.get("window");

export default function InstagramPost() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const post = bakingPosts.find((p) => p.id === id);

	if (!post) {
		return (
			<View style={styles.container}>
				<Text>Post not found</Text>
			</View>
		);
	}

	return (
		<Transition.View style={styles.container}>
			<Transition.ScrollView style={styles.scrollView}>
				{/* Header */}
				<View style={styles.header}>
					<View style={styles.userInfo}>
						<Image
							source={{ uri: "https://i.pravatar.cc/40?u=alex" }}
							style={styles.avatar}
						/>
						<View style={styles.userText}>
							<Text style={styles.username}>alex_anyways18</Text>
							<Text style={styles.location}>with 6 others</Text>
						</View>
					</View>
					<View style={styles.headerRight}>
						<View style={styles.photoCounter}>
							<Text style={styles.counterText}>1/7</Text>
						</View>
						<TouchableOpacity style={styles.menuButton}>
							<Text style={styles.menuDots}>⋯</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Main Image with Shared Element */}

				<View style={styles.imageContainer}>
					<Image
						source={{ uri: post.image }}
						style={styles.mainImage}
						resizeMode="cover"
					/>
				</View>

				{/* Action Buttons */}
				<View style={styles.actionsContainer}>
					<View style={styles.leftActions}>
						<TouchableOpacity style={styles.actionButton}>
							<Text style={styles.actionIcon}>🤍</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.actionButton}>
							<Text style={styles.actionIcon}>💬</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.actionButton}>
							<Text style={styles.actionIcon}>📤</Text>
						</TouchableOpacity>
					</View>
					<View style={styles.rightActions}>
						<TouchableOpacity style={styles.actionButton}>
							<Text style={styles.actionIcon}>🔖</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Engagement */}
				<View style={styles.engagementContainer}>
					<View style={styles.likedByContainer}>
						<View style={styles.likedByAvatars}>
							<Image
								source={{ uri: "https://i.pravatar.cc/20?u=user1" }}
								style={styles.likedByAvatar}
							/>
							<Image
								source={{ uri: "https://i.pravatar.cc/20?u=user2" }}
								style={[styles.likedByAvatar, { marginLeft: -8 }]}
							/>
						</View>
						<Text style={styles.likedByText}>
							Liked by <Text style={styles.boldText}>azevedo_drdr</Text> and
							others
						</Text>
					</View>

					{/* Caption */}
					<View style={styles.captionContainer}>
						<Text style={styles.captionText}>
							<Text style={styles.boldText}>alex_anyways18 </Text>
							it's my bestie{" "}
							<Text style={styles.mentionText}>@kalindi_rainbow</Text>'s bday
							today, add your fav memory with her 🤍💫
						</Text>
					</View>

					{/* View Comments */}
					<TouchableOpacity style={styles.viewCommentsButton}>
						<Text style={styles.viewCommentsText}>View all comments</Text>
					</TouchableOpacity>

					{/* Time */}
					<Text style={styles.timeText}>2 hours ago</Text>
				</View>
			</Transition.ScrollView>
		</Transition.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	scrollView: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 15,
		paddingTop: 75,
		paddingBottom: 10,
		backgroundColor: "#fff",
	},
	userInfo: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	avatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		marginRight: 10,
	},
	userText: {
		flex: 1,
	},
	username: {
		fontSize: 14,
		fontWeight: "600",
		color: "#000",
	},
	location: {
		fontSize: 12,
		color: "#666",
	},
	headerRight: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	photoCounter: {
		backgroundColor: "rgba(0,0,0,0.6)",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	counterText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "500",
	},
	menuButton: {
		padding: 5,
	},
	menuDots: {
		fontSize: 20,
		color: "#000",
	},
	imageContainer: {
		position: "relative",
		width: "100%",

		aspectRatio: 1,

		backgroundColor: "gray",
	},
	mainImage: {
		width: "100%",
		height: "100%",
		resizeMode: "cover",
		aspectRatio: 1,
	},
	addToPostButton: {
		position: "absolute",
		bottom: 15,
		left: 15,
		backgroundColor: "rgba(0,0,0,0.6)",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
		flexDirection: "row",
		alignItems: "center",
	},
	addToPostText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "500",
	},
	actionsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 15,
		paddingVertical: 12,
	},
	leftActions: {
		flexDirection: "row",
		gap: 15,
	},
	rightActions: {
		flexDirection: "row",
	},
	actionButton: {
		padding: 5,
	},
	actionIcon: {
		fontSize: 24,
	},
	engagementContainer: {
		paddingHorizontal: 15,
		paddingBottom: 20,
	},
	likedByContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	likedByAvatars: {
		flexDirection: "row",
		marginRight: 8,
	},
	likedByAvatar: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#fff",
	},
	likedByText: {
		fontSize: 13,
		color: "#000",
	},
	boldText: {
		fontWeight: "600",
	},
	captionContainer: {
		marginBottom: 8,
	},
	captionText: {
		fontSize: 13,
		color: "#000",
		lineHeight: 18,
	},
	mentionText: {
		color: "#00376b",
		fontWeight: "600",
	},
	viewCommentsButton: {
		marginBottom: 8,
	},
	viewCommentsText: {
		fontSize: 13,
		color: "#999",
	},
	timeText: {
		fontSize: 11,
		color: "#999",
		textTransform: "uppercase",
	},
	bottomNav: {
		flexDirection: "row",
		backgroundColor: "#fff",
		paddingVertical: 10,
		paddingBottom: 25,
		borderTopWidth: 0.5,
		borderTopColor: "#e0e0e0",
	},
	navItem: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	navIcon: {
		fontSize: 22,
	},
});
