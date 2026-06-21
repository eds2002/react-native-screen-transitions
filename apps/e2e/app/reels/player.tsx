import { useLocalSearchParams } from "expo-router";
import { VideoView } from "expo-video";
import type { ComponentType } from "react";
import { useMemo } from "react";
import {
	type FlatListProps,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { REELS, REELS_GROUP, type Reel, reelId } from "./constants";
import { getReelPlayer } from "./players";

const ReelFlatList = Transition.FlatList as unknown as ComponentType<
	FlatListProps<PlayerReel>
>;

type PlayerReel = {
	reel: Reel;
	reelIndex: number;
};

type ReelPageProps = {
	reel: Reel;
	reelIndex: number;
	height: number;
	isBoundary: boolean;
};

/**
 * Fullscreen page. Only the route-param reel is a boundary: it renders no
 * player of its own because the teleported feed card is the live surface.
 * Every later page is a plain video, so scrolling does not retarget the group.
 */
function ReelPage({ reel, reelIndex, height, isBoundary }: ReelPageProps) {
	const insets = useSafeAreaInsets();

	const caption = (
		<View style={[styles.caption, { paddingBottom: insets.bottom + 24 }]}>
			<Text style={styles.author}>{reel.author}</Text>
			<Text style={styles.captionTitle}>{reel.title}</Text>
		</View>
	);

	if (isBoundary) {
		return (
			<Transition.Boundary.View
				testID={`reel-page-${reelIndex}`}
				id={reelId(reelIndex)}
				group={REELS_GROUP}
				style={[styles.page, { height }]}
			>
				{caption}
			</Transition.Boundary.View>
		);
	}

	const player = getReelPlayer(reel);

	return (
		<View testID={`reel-page-${reelIndex}`} style={[styles.page, { height }]}>
			<VideoView
				player={player}
				style={styles.video}
				contentFit="cover"
				nativeControls={false}
			/>
			{caption}
		</View>
	);
}

export default function ReelsPlayer() {
	const { index } = useLocalSearchParams<{ index?: string }>();
	const { height: windowHeight } = useWindowDimensions();
	const initialIndex = Math.min(
		Math.max(Number(index ?? 0) || 0, 0),
		REELS.length - 1,
	);
	const reels = useMemo(
		() =>
			REELS.slice(initialIndex).map((reel, offset) => ({
				reel,
				reelIndex: initialIndex + offset,
			})),
		[initialIndex],
	);

	return (
		<ReelFlatList
			style={styles.container}
			data={reels}
			keyExtractor={(item) => item.reel.id}
			pagingEnabled
			showsVerticalScrollIndicator={false}
			getItemLayout={(_, itemIndex) => ({
				length: windowHeight,
				offset: windowHeight * itemIndex,
				index: itemIndex,
			})}
			renderItem={({ item, index: itemIndex }) => (
				<ReelPage
					reel={item.reel}
					reelIndex={item.reelIndex}
					height={windowHeight}
					isBoundary={itemIndex === 0}
				/>
			)}
		/>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	page: {
		width: "100%",
	},
	video: {
		...StyleSheet.absoluteFillObject,
	},
	caption: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		paddingHorizontal: 16,
		gap: 4,
	},
	author: {
		color: "white",
		fontSize: 14,
		fontWeight: "600",
	},
	captionTitle: {
		color: "rgba(255,255,255,0.85)",
		fontSize: 15,
	},
});
