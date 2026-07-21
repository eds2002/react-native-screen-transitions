import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View } from "react-native";
import Transition from "react-native-screen-transitions";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import {
	MATCHED_SCREEN_BOUNDARY_GROUP,
	MATCHED_SCREEN_GRID_WIDTH,
	MATCHED_SCREEN_SQUARE_SIZE,
	MATCHED_SCREEN_SQUARE_VIDEOS,
	MATCHED_SCREEN_WIDE_ASPECT_RATIO,
	MATCHED_SCREEN_WIDE_VIDEO,
	type MatchedScreenVideo,
	type MatchedScreenVideoId,
} from "./constants";

type VideoCardProps = {
	example: MatchedScreenVideo;
	onPress: () => void;
};

function VideoCard({ example, onPress }: VideoCardProps) {
	const player = useVideoPlayer(example.source, (videoPlayer) => {
		videoPlayer.loop = true;
		videoPlayer.muted = true;
		videoPlayer.play();
	});
	const isSquare = example.aspectRatio === 1;
	const cardStyle = isSquare ? styles.squareCard : styles.wideCard;

	return (
		<Transition.Boundary
			accessibilityLabel={`Open ${example.id} video example`}
			accessibilityRole="button"
			escapeClipping
			group={MATCHED_SCREEN_BOUNDARY_GROUP}
			handoff
			id={example.id}
			onPress={onPress}
			style={cardStyle}
			testID={`matched-screen-open-${example.id}`}
		>
			<Transition.Boundary.Target
				pointerEvents="none"
				style={[styles.videoCard, cardStyle]}
			>
				<VideoView
					allowsVideoFrameAnalysis={false}
					contentFit="cover"
					nativeControls={false}
					player={player}
					pointerEvents="none"
					style={StyleSheet.absoluteFill}
					surfaceType="textureView"
				/>
			</Transition.Boundary.Target>
		</Transition.Boundary>
	);
}

export default function MatchedScreenIndex() {
	const stackType = useResolvedStackType();

	const openVideo = (id: MatchedScreenVideoId) => {
		router.push({
			pathname: buildStackPath(
				stackType,
				"bounds/matched-screen/player",
			) as never,
			params: { id },
		});
	};

	return (
		<View style={styles.home}>
			<StatusBar style="dark" />
			<View style={styles.mediaStack}>
				<View style={styles.grid}>
					{MATCHED_SCREEN_SQUARE_VIDEOS.map((example) => (
						<VideoCard
							example={example}
							key={example.id}
							onPress={() => openVideo(example.id)}
						/>
					))}
				</View>
				<VideoCard
					example={MATCHED_SCREEN_WIDE_VIDEO}
					onPress={() => openVideo(MATCHED_SCREEN_WIDE_VIDEO.id)}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	home: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#FFFFFF",
	},
	mediaStack: {
		width: MATCHED_SCREEN_GRID_WIDTH,
		gap: 12,
	},
	grid: {
		width: MATCHED_SCREEN_GRID_WIDTH,
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},
	squareCard: {
		width: MATCHED_SCREEN_SQUARE_SIZE,
		height: MATCHED_SCREEN_SQUARE_SIZE,
		borderCurve: "continuous",
		borderRadius: 32,
	},
	wideCard: {
		width: MATCHED_SCREEN_GRID_WIDTH,
		aspectRatio: MATCHED_SCREEN_WIDE_ASPECT_RATIO,
		borderCurve: "continuous",
		borderRadius: 30,
	},
	videoCard: {
		overflow: "hidden",
	},
});
