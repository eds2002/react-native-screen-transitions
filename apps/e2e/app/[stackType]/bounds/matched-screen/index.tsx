import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import {
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import { MATCHED_SCREEN_VIDEOS } from "./constants";

type FeedVideoCardProps = {
	onPress: () => void;
	video: (typeof MATCHED_SCREEN_VIDEOS)[number];
	width: number;
};

function FeedVideoCard({ onPress, video, width }: FeedVideoCardProps) {
	const theme = useTheme();
	const player = useVideoPlayer(video.source, (videoPlayer) => {
		videoPlayer.loop = true;
		videoPlayer.muted = !video.playsAudio;
		videoPlayer.volume = video.playsAudio ? 1 : 0;
		videoPlayer.play();
	});

	useEffect(() => {
		player.muted = !video.playsAudio;
		player.volume = video.playsAudio ? 1 : 0;
	}, [player, video.playsAudio]);

	const cardStyle = {
		width,
		height: width / video.aspectRatio,
	};

	return (
		<View style={cardStyle}>
			<Transition.Boundary
				id={video.id}
				testID={`${video.id}-source`}
				portal="matched-screen"
			>
				<Transition.Boundary.Target
					pointerEvents="none"
					style={[
						styles.videoCard,
						cardStyle,
						{ backgroundColor: theme.card },
					]}
				>
					<VideoView
						player={player}
						style={StyleSheet.absoluteFill}
						contentFit="cover"
						nativeControls={false}
						allowsVideoFrameAnalysis={false}
						pointerEvents="none"
					/>
				</Transition.Boundary.Target>
			</Transition.Boundary>
			<Pressable
				testID={`${video.id}-press`}
				style={styles.videoPressTarget}
				onPress={onPress}
			/>
		</View>
	);
}

export default function MatchedScreenIndex() {
	const stackType = useResolvedStackType();
	const theme = useTheme();
	const { width } = useWindowDimensions();
	const cardWidth = Math.min(width - 48, 380);

	const openPlayer = () => {
		router.push(
			buildStackPath(stackType, "bounds/matched-screen/player") as never,
		);
	};

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<Transition.ScrollView
				style={styles.container}
				contentContainerStyle={styles.feed}
				showsVerticalScrollIndicator={false}
			>
				<Transition.Boundary.Host />
				<View style={styles.header}>
					<Text style={[styles.title, { color: theme.text }]}>
						Matched Screen
					</Text>
					<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
						Stacked on source, paired on destination
					</Text>
				</View>
				<View testID="matched-screen-video-trigger" style={styles.videoStack}>
					{MATCHED_SCREEN_VIDEOS.map((video) => (
						<FeedVideoCard
							key={video.id}
							onPress={openPlayer}
							video={video}
							width={cardWidth}
						/>
					))}
				</View>
				<View style={styles.feedTail} />
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	feed: {
		alignItems: "center",
		paddingHorizontal: 24,
		paddingTop: 24,
	},
	header: {
		alignSelf: "stretch",
		gap: 4,
		marginBottom: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: "800",
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "600",
	},
	videoStack: {
		alignItems: "center",
		gap: 22,
	},
	videoCard: {
		overflow: "hidden",
	},
	videoPressTarget: {
		...StyleSheet.absoluteFillObject,
		elevation: 1,
		zIndex: 1,
	},
	caption: {
		gap: 2,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: "800",
	},
	cardSubtitle: {
		fontSize: 13,
		fontWeight: "600",
	},
	feedTail: {
		height: 320,
	},
});
