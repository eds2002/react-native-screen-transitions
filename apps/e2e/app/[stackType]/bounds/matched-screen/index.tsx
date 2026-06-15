import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import {
	MATCHED_SCREEN_VIDEO_ID,
	MATCHED_SCREEN_VIDEO_SOURCE,
} from "./constants";

export default function MatchedScreenIndex() {
	const stackType = useResolvedStackType();
	const theme = useTheme();
	const { width } = useWindowDimensions();
	const cardWidth = Math.min(width - 48, 360);
	const cardHeight = cardWidth * 1.35;
	const player = useVideoPlayer(MATCHED_SCREEN_VIDEO_SOURCE, (videoPlayer) => {
		videoPlayer.loop = true;
		videoPlayer.muted = true;
		videoPlayer.play();
	});

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
				<Text style={[styles.title, { color: theme.text }]}>
					Matched Screen
				</Text>
				<Transition.Boundary.Trigger
					id={MATCHED_SCREEN_VIDEO_ID}
					testID="matched-screen-video-trigger"
					portal={{ attachTo: "matched-screen" }}
					onPress={() =>
						router.push(
							buildStackPath(
								stackType,
								"bounds/matched-screen/player",
							) as never,
						)
					}
				>
					<Transition.Boundary.Target
						pointerEvents="none"
						style={[
							styles.videoCard,
							{
								width: cardWidth,
								height: cardHeight,
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
				</Transition.Boundary.Trigger>
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
		gap: 16,
		paddingHorizontal: 24,
		paddingTop: 24,
	},
	title: {
		alignSelf: "flex-start",
		fontSize: 22,
		fontWeight: "700",
	},
	videoCard: {
		overflow: "hidden",
	},
	feedTail: {
		height: 360,
	},
});
