import { router } from "expo-router";
import {
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";
import { MATCHED_SCREEN_VIDEOS } from "./constants";

const PLAYER_SLOT_ASPECT_RATIO = 9 / 16;
const PLAYER_COLUMN_GAP = 12;
const PLAYER_ROW_GAP = 14;

type PlayerSlotProps = {
	video: (typeof MATCHED_SCREEN_VIDEOS)[number];
	width: number;
};

function PlayerSlot({ video, width }: PlayerSlotProps) {
	const theme = useTheme();

	return (
		<View style={styles.slotWrap}>
			<View
				style={[
					styles.videoSlot,
					{
						width,
						height: width / PLAYER_SLOT_ASPECT_RATIO,
					},
				]}
			>
				<Transition.Boundary.View
					id={video.id}
					testID={`${video.id}-destination`}
					style={StyleSheet.absoluteFill}
				/>
			</View>
			<Text style={[styles.slotLabel, { color: theme.textSecondary }]}>
				{video.title}
			</Text>
		</View>
	);
}

export default function MatchedScreenPlayer() {
	const theme = useTheme();
	const { width } = useWindowDimensions();
	const slotWidth = Math.floor(width / 2);
	const leadingVideos = MATCHED_SCREEN_VIDEOS.filter(
		(_, index) => index % 2 === 0,
	);
	const trailingVideos = MATCHED_SCREEN_VIDEOS.filter(
		(_, index) => index % 2 === 1,
	);

	return (
		<SafeAreaView style={[styles.container]}>
			<View style={styles.content}>
				<View style={styles.stage}>
					<View style={styles.column}>
						{leadingVideos.map((video) => (
							<PlayerSlot key={video.id} video={video} width={slotWidth} />
						))}
					</View>
					<View style={[styles.column, styles.trailingColumn]}>
						{trailingVideos.map((video) => (
							<PlayerSlot key={video.id} video={video} width={slotWidth} />
						))}
					</View>
				</View>

				<Pressable
					testID="matched-screen-video-close"
					style={[
						styles.closeButton,
						{
							borderColor: theme.separator,
						},
					]}
					onPress={() => router.back()}
				>
					<Text style={[styles.closeText, { color: theme.text }]}>Close</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 28,
		// paddingHorizontal: 18,
	},
	stage: {
		alignItems: "flex-start",
		flexDirection: "row",
		gap: PLAYER_COLUMN_GAP,
		justifyContent: "center",
	},
	column: {
		gap: PLAYER_ROW_GAP,
	},
	trailingColumn: {
		paddingTop: 52,
	},
	slotWrap: {
		alignItems: "center",
		gap: 10,
	},
	videoSlot: {
		overflow: "hidden",
	},
	slotLabel: {
		fontSize: 13,
		fontWeight: "700",
	},
	closeButton: {
		borderWidth: 1,
		paddingHorizontal: 18,
		paddingVertical: 10,
	},
	closeText: {
		fontSize: 15,
		fontWeight: "700",
	},
});
