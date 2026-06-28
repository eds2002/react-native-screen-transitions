import { router } from "expo-router";
import { VideoView } from "expo-video";
import type { ComponentType } from "react";
import {
	type FlatListProps,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";
import { REELS, REELS_GROUP, type Reel, reelId } from "./constants";
import { getReelPlayer } from "./players";

const FeedFlatList = Transition.FlatList as unknown as ComponentType<
	FlatListProps<Reel>
>;

const GRID_COLUMNS = 3;
const GRID_GAP = 2;
const REEL_ASPECT_RATIO = 9 / 16;

function openReel(index: number) {
	router.push({ pathname: "/reels/player", params: { index: String(index) } });
}

type ReelCardProps = {
	reel: Reel;
	index: number;
	width: number;
	height: number;
};

/**
 * Autoplaying muted feed card. The VideoView is the boundary target, so the
 * matched-screen teleport moves the live native player into the fullscreen
 * host — playback carries across the transition without remounting.
 */
function ReelCard({ reel, index, width, height }: ReelCardProps) {
	const theme = useTheme();
	const player = getReelPlayer(reel);

	return (
		<Transition.Boundary.Trigger
			testID={`reel-card-${index}`}
			id={reelId(index)}
			group={REELS_GROUP}
			portal={{ attachTo: "matched-screen" }}
			onPress={() => openReel(index)}
		>
			<Transition.Boundary.Target
				style={[styles.card, { width, height, backgroundColor: theme.card }]}
				pointerEvents="none"
			>
				<VideoView
					player={player}
					style={styles.video}
					contentFit="cover"
					pointerEvents="none"
					nativeControls={false}
				/>
			</Transition.Boundary.Target>
			<View style={styles.durationBadge}>
				<Text style={styles.durationText}>▶ {reel.duration}</Text>
			</View>
		</Transition.Boundary.Trigger>
	);
}

export default function ReelsFeed() {
	const theme = useTheme();
	const insets = useSafeAreaInsets();
	const { width: windowWidth } = useWindowDimensions();
	const cellWidth =
		(windowWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
	const cellHeight = cellWidth / REEL_ASPECT_RATIO;

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: theme.bg, paddingTop: insets.top },
			]}
		>
			<Text style={[styles.title, { color: theme.text }]}>Reels</Text>
			<FeedFlatList
				data={REELS}
				keyExtractor={(item) => item.id}
				numColumns={GRID_COLUMNS}
				columnWrapperStyle={styles.gridRow}
				contentContainerStyle={styles.grid}
				renderItem={({ item, index }) => (
					<ReelCard
						reel={item}
						index={index}
						width={cellWidth}
						height={cellHeight}
					/>
				)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	title: {
		fontSize: 28,
		fontWeight: "600",
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	grid: {
		gap: GRID_GAP,
	},
	gridRow: {
		gap: GRID_GAP,
	},
	card: {
		overflow: "hidden",
	},
	video: {
		width: "100%",
		height: "100%",
	},
	durationBadge: {
		position: "absolute",
		bottom: 8,
		left: 8,
		backgroundColor: "rgba(0,0,0,0.55)",
		borderRadius: 8,
		paddingHorizontal: 6,
		paddingVertical: 2,
	},
	durationText: {
		color: "white",
		fontSize: 11,
		fontWeight: "600",
	},
});
