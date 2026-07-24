import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { type ComponentType, useCallback } from "react";
import {
	type FlatListProps,
	type ListRenderItemInfo,
	StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import {
	MATCHED_SCREEN_ASPECT_RATIO,
	MATCHED_SCREEN_BOUNDARY_GROUP,
	MATCHED_SCREEN_DETAIL_WIDTH,
	MATCHED_SCREEN_VIDEOS,
	type MatchedScreenVideo,
	type MatchedScreenVideoId,
} from "./constants";

type VideoCardProps = {
	example: MatchedScreenVideo;
	onPress: () => void;
};

const MatchedScreenFlatList = Transition.FlatList as ComponentType<
	FlatListProps<MatchedScreenVideo>
>;

function VideoCard({ example, onPress }: VideoCardProps) {
	const player = useVideoPlayer(example.source, (videoPlayer) => {
		videoPlayer.loop = true;
		videoPlayer.muted = true;
		videoPlayer.play();
	});

	return (
		<Transition.Boundary
			accessibilityLabel={`Open ${example.id} video example`}
			accessibilityRole="button"
			escapeClipping
			group={MATCHED_SCREEN_BOUNDARY_GROUP}
			handoff
			id={example.id}
			onPress={onPress}
			style={styles.card}
			testID={`matched-screen-open-${example.id}`}
		>
			<Transition.Boundary.Target
				pointerEvents="none"
				style={[styles.videoCard, styles.card]}
			>
				<VideoView
					allowsVideoFrameAnalysis={false}
					nativeControls={true}
					player={player}
					pointerEvents="none"
					style={StyleSheet.absoluteFill}
					contentFit="contain"
					surfaceType="surfaceView"
				/>
			</Transition.Boundary.Target>
		</Transition.Boundary>
	);
}

export default function MatchedScreenIndex() {
	const stackType = useResolvedStackType();

	const openVideo = useCallback(
		(id: MatchedScreenVideoId) => {
			router.push({
				pathname: buildStackPath(
					stackType,
					"bounds/matched-screen/player",
				) as never,
				params: { id },
			});
		},
		[stackType],
	);

	const renderItem = useCallback(
		({ item }: ListRenderItemInfo<MatchedScreenVideo>) => (
			<VideoCard example={item} onPress={() => openVideo(item.id)} />
		),
		[openVideo],
	);

	return (
		<SafeAreaView style={styles.home} edges={["top"]}>
			<StatusBar style="dark" />
			<MatchedScreenFlatList
				contentContainerStyle={styles.listContent}
				data={MATCHED_SCREEN_VIDEOS}
				keyExtractor={(item) => item.id}
				renderItem={renderItem}
				removeClippedSubviews={false}
				showsVerticalScrollIndicator={false}
				style={styles.list}
				testID="matched-screen-list"
				windowSize={5}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	home: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	list: {
		flex: 1,
	},
	listContent: {
		alignItems: "center",
		gap: 0,
		paddingHorizontal: 16,
		paddingVertical: 32,
	},
	card: {
		aspectRatio: MATCHED_SCREEN_ASPECT_RATIO,
		borderCurve: "continuous",
		borderRadius: 28,
		maxWidth: MATCHED_SCREEN_DETAIL_WIDTH,
		width: "100%",
	},
	videoCard: {
		overflow: "hidden",
	},
});
