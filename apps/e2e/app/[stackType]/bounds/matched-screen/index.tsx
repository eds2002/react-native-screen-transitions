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
	video: (typeof MATCHED_SCREEN_VIDEOS)[number];
	width: number;
};

function FeedVideoCard({ video, width }: FeedVideoCardProps) {
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

	return (
		<Transition.Boundary.View
			id={video.id}
			testID={`${video.id}-source`}
			portal={{ attachTo: "matched-screen" }}
			style={styles.boundary}
		>
			<Transition.Boundary.Target
				pointerEvents="none"
				style={[
					styles.videoCard,
					{
						width,
						height: width / video.aspectRatio,
						backgroundColor: theme.card,
					},
				]}
			>
				<VideoView
					player={player}
					style={StyleSheet.absoluteFill}
					contentFit="cover"
					nativeControls={false}
					pointerEvents="none"
				/>
			</Transition.Boundary.Target>
		</Transition.Boundary.View>
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
				<Pressable
					testID="matched-screen-video-trigger"
					style={styles.videoStack}
					onPress={openPlayer}
				>
					{MATCHED_SCREEN_VIDEOS.map((video) => (
						<FeedVideoCard key={video.id} video={video} width={cardWidth} />
					))}
				</Pressable>
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
	boundary: {
		gap: 10,
	},
	videoCard: {
		overflow: "hidden",
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
