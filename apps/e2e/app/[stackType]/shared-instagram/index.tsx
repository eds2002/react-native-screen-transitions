import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
	ScrollView,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { INSTAGRAM_IMAGES } from "./constants";

const GRID_COLUMNS = 3;
const GRID_GAP = 1;
const PLACEHOLDER_COLOR = "#F1F5F9";
const PROFILE_BG = "#FFFFFF";
const DETAIL_HEIGHT = 490;

export default function SharedInstagramIndex() {
	const stackType = useResolvedStackType();
	const { width } = useWindowDimensions();
	const itemWidth = (width - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
	const aspectRatio = width / DETAIL_HEIGHT;

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<ScreenHeader
					light
					title="Deprecated Shared Instagram Preset"
					subtitle="Legacy SharedIGImage grid -> post detail"
				/>

				<View style={styles.profileHeader}>
					<View style={styles.avatarFrame}>
						<View style={styles.avatarBadgeOuter}>
							<View style={styles.avatarBadgeInner}>
								<FontAwesome6 name="plus" size={11} color="#FFF" />
							</View>
						</View>
					</View>

					<View style={styles.profileCopy}>
						<Text style={styles.username}>trpfsu</Text>
						<View style={styles.statsRow}>
							<ProfileStat value="9" label="posts" />
							<ProfileStat value="67" label="followers" />
							<ProfileStat value="61" label="following" />
						</View>
					</View>
				</View>

				<View style={styles.actionRow}>
					<ActionPill label="Edit profile" />
					<ActionPill label="Share profile" />
					<View style={styles.iconPill}>
						<FontAwesome6 name="user-plus" size={11} color="#000" />
					</View>
				</View>

				<View style={styles.highlightsRow}>
					<View style={styles.highlightBubble}>
						<FontAwesome6 name="plus" size={22} color="#000" />
					</View>
				</View>

				<View style={styles.tabRow}>
					<View style={styles.tabIconSlot}>
						<MaterialCommunityIcons
							name="grid"
							size={28}
							color="#000"
						/>
					</View>
					<View style={styles.tabIconSlot}>
						<MaterialCommunityIcons
							name="tag-outline"
							size={28}
							color="#000"
						/>
					</View>
				</View>
				<View style={styles.divider} />

				<View style={styles.grid}>
					{INSTAGRAM_IMAGES.map((image, index) => {
						const isLastInRow = (index + 1) % GRID_COLUMNS === 0;
						const sharedBoundId = `shared-instagram-${image.id}`;

						return (
							<Transition.Pressable
								key={image.id}
								sharedBoundTag={sharedBoundId}
								style={[
									styles.gridItem,
									{
										width: itemWidth,
										aspectRatio,
										marginRight: isLastInRow ? 0 : GRID_GAP,
									},
								]}
								onPress={() => {
									router.push({
										pathname: buildStackPath(
											stackType,
											`shared-instagram/${image.id}`,
										) as never,
										params: { sharedBoundId },
									});
								}}
							>
								<Image
									source={image.url}
									style={styles.gridImage}
									contentFit="cover"
								/>
							</Transition.Pressable>
						);
					})}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

function ProfileStat({ value, label }: { value: string; label: string }) {
	return (
		<View style={styles.statBlock}>
			<Text style={styles.statValue}>{value}</Text>
			<Text style={styles.statLabel}>{label}</Text>
		</View>
	);
}

function ActionPill({ label }: { label: string }) {
	return (
		<View style={styles.actionPill}>
			<Text style={styles.actionPillLabel}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: PROFILE_BG,
	},
	content: {
		paddingBottom: 32,
	},
	profileHeader: {
		flexDirection: "row",
		gap: 20,
		paddingHorizontal: 16,
		marginTop: 20,
	},
	avatarFrame: {
		width: 88,
		height: 88,
		borderRadius: 999,
		backgroundColor: PLACEHOLDER_COLOR,
	},
	avatarBadgeOuter: {
		position: "absolute",
		right: -8,
		bottom: -8,
		width: 32,
		height: 32,
		borderRadius: 999,
		backgroundColor: "#FFF",
		alignItems: "center",
		justifyContent: "center",
	},
	avatarBadgeInner: {
		width: 24,
		height: 24,
		borderRadius: 999,
		backgroundColor: "#000",
		alignItems: "center",
		justifyContent: "center",
	},
	profileCopy: {
		flex: 1,
		gap: 14,
	},
	username: {
		fontSize: 14,
		fontWeight: "600",
		color: "#000",
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 16,
	},
	statBlock: {
		alignItems: "flex-start",
	},
	statValue: {
		fontSize: 16,
		fontWeight: "700",
		color: "#000",
	},
	statLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: "#000",
	},
	actionRow: {
		flexDirection: "row",
		gap: 6,
		paddingHorizontal: 16,
		marginTop: 20,
	},
	actionPill: {
		flex: 1,
		borderRadius: 10,
		backgroundColor: PLACEHOLDER_COLOR,
		paddingVertical: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	actionPillLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: "#000",
	},
	iconPill: {
		borderRadius: 10,
		backgroundColor: PLACEHOLDER_COLOR,
		paddingHorizontal: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	highlightsRow: {
		paddingHorizontal: 16,
		marginTop: 18,
	},
	highlightBubble: {
		width: 62,
		height: 62,
		borderRadius: 999,
		borderWidth: 2,
		borderColor: PLACEHOLDER_COLOR,
		alignItems: "center",
		justifyContent: "center",
	},
	tabRow: {
		flexDirection: "row",
		marginTop: 36,
	},
	tabIconSlot: {
		flex: 1,
		alignItems: "center",
	},
	divider: {
		height: 1,
		backgroundColor: PLACEHOLDER_COLOR,
		marginTop: 8,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 1,
	},
	gridItem: {
		marginBottom: GRID_GAP,
		backgroundColor: PLACEHOLDER_COLOR,
		overflow: "hidden",
	},
	gridImage: {
		flex: 1,
	},
});
