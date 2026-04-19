import { FontAwesome6 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { getXPostImageUrl, X_POST_IDS } from "./constants";

const PLACEHOLDER_COLOR = "#E5E7EB";

export default function SharedXImageIndex() {
	const stackType = useResolvedStackType();

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<ScreenHeader
					light
					title="Shared X Image"
					subtitle="SharedXImage feed -> fullscreen media"
				/>

				<View style={styles.brandRow}>
					<View style={styles.profileDot} />
					<Text style={styles.brandTitle}>X</Text>
					<View style={styles.brandSpacer} />
				</View>

				<View style={styles.tabs}>
					<Text style={styles.activeTab}>For you</Text>
					<Text style={styles.inactiveTab}>Following</Text>
				</View>
				<View style={styles.activeUnderline} />

				{X_POST_IDS.map((postId) => (
					<Post key={postId} postId={postId} stackType={stackType} />
				))}
			</ScrollView>
		</SafeAreaView>
	);
}

function Post({
	postId,
	stackType,
}: {
	postId: string;
	stackType: "blank-stack" | "native-stack";
}) {
	const boundId = `shared-x-image-${postId}`;
	const imageUrl = getXPostImageUrl(postId);

	return (
		<View style={styles.post}>
			<View style={styles.postRow}>
				<View style={styles.avatar} />
				<View style={styles.postContent}>
					<View style={styles.metaRow}>
						<Text style={styles.author}>User</Text>
						<Text style={styles.handle}>@username</Text>
						<Text style={styles.handle}>12h</Text>
					</View>

					<Transition.Pressable
						sharedBoundTag={boundId}
						style={styles.imageFrame}
						onPress={() => {
							router.push({
								pathname: buildStackPath(
									stackType,
									`shared-x-image/${postId}`,
								) as never,
								params: {
									boundId,
									url: imageUrl,
								},
							});
						}}
					>
						<Image
							source={imageUrl}
							style={styles.image}
							contentFit="cover"
							transition={200}
						/>
					</Transition.Pressable>

					<View style={styles.actionsRow}>
						<Action icon="comment" label="0" />
						<Action icon="retweet" label="0" />
						<Action icon="heart" label="0" />
					</View>
				</View>
			</View>
		</View>
	);
}

function Action({
	icon,
	label,
}: {
	icon: "comment" | "retweet" | "heart";
	label: string;
}) {
	return (
		<View style={styles.action}>
			<FontAwesome6 name={icon} size={15} color="#6B7280" />
			<Text style={styles.actionLabel}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFF",
	},
	content: {
		paddingBottom: 32,
	},
	brandRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		marginTop: 8,
	},
	profileDot: {
		width: 32,
		height: 32,
		borderRadius: 999,
		backgroundColor: PLACEHOLDER_COLOR,
	},
	brandTitle: {
		fontSize: 28,
		fontWeight: "800",
		color: "#000",
	},
	brandSpacer: {
		width: 32,
	},
	tabs: {
		flexDirection: "row",
		gap: 22,
		paddingHorizontal: 16,
		marginTop: 18,
	},
	activeTab: {
		fontSize: 16,
		fontWeight: "700",
		color: "#000",
	},
	inactiveTab: {
		fontSize: 16,
		fontWeight: "600",
		color: "#6B7280",
	},
	activeUnderline: {
		height: 3,
		width: 64,
		borderRadius: 999,
		backgroundColor: "#F43F5E",
		marginTop: 10,
		marginHorizontal: 16,
	},
	post: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(209,213,219,0.5)",
	},
	postRow: {
		flexDirection: "row",
		gap: 8,
	},
	avatar: {
		width: 44,
		height: 44,
		borderRadius: 999,
		backgroundColor: PLACEHOLDER_COLOR,
	},
	postContent: {
		flex: 1,
		gap: 8,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	author: {
		fontSize: 16,
		fontWeight: "700",
		color: "#000",
	},
	handle: {
		fontSize: 14,
		color: "#6B7280",
	},
	imageFrame: {
		aspectRatio: 1,
		width: "100%",
		borderRadius: 10,
		overflow: "hidden",
		backgroundColor: PLACEHOLDER_COLOR,
	},
	image: {
		flex: 1,
	},
	actionsRow: {
		flexDirection: "row",
		gap: 28,
	},
	action: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	actionLabel: {
		fontSize: 14,
		color: "#6B7280",
	},
});
