import { useEvent } from "expo";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import {
	type ListRenderItemInfo,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { runOnJS, useAnimatedScrollHandler } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";
import { REEL_ITEMS, REELS_GROUP, selectedId } from "./constants";

const PLACEHOLDER_COLOR = "#e3e7e8";
const PHONE_ASPECT_RATIO = 16 / 9;
const FEED_GAP = 28;
const COPY_HEIGHT = 110;
const AUTHOR_ROW_HEIGHT = 44;
const FEED_ITEM_INNER_GAP = 12;
const THUMBNAIL_CROP_SCALE = 1.2;

function ReelFeedItem({
	id,
	profileName,
	handle,
	caption,
	videoSource,
	thumbnailSource,
	isActive,
	videoWidth,
	videoHeight,
	textColor,
	textSecondary,
	actionColor,
}: {
	id: string;
	profileName: string;
	handle: string;
	caption: string;
	videoSource: number;
	thumbnailSource: number;
	isActive: boolean;
	videoWidth: number;
	videoHeight: number;
	textColor: string;
	textSecondary: string;
	actionColor: string;
}) {
	return (
		<View style={styles.feedItem}>
			<View style={styles.authorRow}>
				<View
					style={[
						styles.avatar,
						{ backgroundColor: `${actionColor}22`, borderColor: actionColor },
					]}
				/>
				<View style={styles.authorCopy}>
					<Text style={[styles.handle, { color: textColor }]}>
						{profileName}
					</Text>
					<Text style={[styles.audioMeta, { color: textSecondary }]}>
						@{handle} • Original audio
					</Text>
				</View>
			</View>

			<Transition.Boundary.View
				id={id}
				group={REELS_GROUP}
				anchor="center"
				scaleMode="match"
				style={[
					styles.videoFrame,
					{
						width: videoWidth,
						height: videoHeight,
						backgroundColor: PLACEHOLDER_COLOR,
					},
				]}
			>
				<View
					style={[
						styles.mediaContainer,
						{ backgroundColor: PLACEHOLDER_COLOR },
					]}
				>
					<Image
						source={thumbnailSource}
						style={styles.thumbnailFill}
						contentFit="cover"
						transition={0}
						cachePolicy="memory-disk"
					/>
					{isActive ? <ActiveReelVideo videoSource={videoSource} /> : null}
				</View>
			</Transition.Boundary.View>

			<View style={styles.metaBlock}>
				<Text style={[styles.metaLine, { color: textSecondary }]}>
					Liked by jalegira2_ and others
				</Text>
				<Text style={[styles.caption, { color: textColor }]}>
					<Text style={styles.captionHandle}>{handle} </Text>
					{caption}
				</Text>
			</View>
		</View>
	);
}

function ActiveReelVideo({ videoSource }: { videoSource: number }) {
	const player = useVideoPlayer(videoSource, (videoPlayer) => {
		videoPlayer.loop = true;
		videoPlayer.muted = true;
		videoPlayer.currentTime = 0;
	});
	const [hasFirstFrame, setHasFirstFrame] = useState(false);
	const { status } = useEvent(player, "statusChange", {
		status: player.status,
	});

	useEffect(() => {
		setHasFirstFrame(false);
	}, [videoSource]);

	useEffect(() => {
		if (status !== "readyToPlay") {
			return;
		}

		player.replay();
	}, [player, status]);

	return (
		<VideoView
			player={player}
			style={[styles.mediaFill, !hasFirstFrame && styles.hiddenMedia]}
			contentFit="cover"
			nativeControls={false}
			surfaceType="textureView"
			requiresLinearPlayback
			onFirstFrameRender={() => {
				setHasFirstFrame(true);
			}}
		/>
	);
}

export default function ReelDetail() {
	const theme = useTheme();
	const { width } = useWindowDimensions();
	const { id: routeId } = useLocalSearchParams<{ id?: string }>();
	const initialReelIdRef = useRef(routeId ?? selectedId.value ?? REEL_ITEMS[0].id);
	const lastActiveReelIdRef = useRef(initialReelIdRef.current);
	const [activeReelId, setActiveReelId] = useState(initialReelIdRef.current);
	const initialIndex = Math.max(
		0,
		REEL_ITEMS.findIndex((item) => item.id === initialReelIdRef.current),
	);
	const videoWidth = width;
	const videoHeight = videoWidth * PHONE_ASPECT_RATIO;
	const itemHeight =
		AUTHOR_ROW_HEIGHT + FEED_ITEM_INNER_GAP * 2 + videoHeight + COPY_HEIGHT;
	const itemStride = itemHeight + FEED_GAP;

	useEffect(() => {
		if (!routeId) return;
		selectedId.value = routeId;
		lastActiveReelIdRef.current = routeId;
		setActiveReelId((currentId) =>
			currentId === routeId ? currentId : routeId,
		);
	}, [routeId]);

	const syncActiveReelIndex = (pageIndex: number) => {
		if (pageIndex < 0 || pageIndex >= REEL_ITEMS.length) return;
		const item = REEL_ITEMS[pageIndex];
		if (lastActiveReelIdRef.current === item.id) return;

		lastActiveReelIdRef.current = item.id;
		setActiveReelId((currentId) =>
			currentId === item.id ? currentId : item.id,
		);
		selectedId.value = item.id;
	};

	const scrollHandler = useAnimatedScrollHandler<{ lastIndex?: number }>({
		onScroll: (event, context) => {
			const nextIndex = Math.max(
				0,
				Math.min(
					REEL_ITEMS.length - 1,
					Math.round(event.contentOffset.y / itemStride),
				),
			);

			if (context.lastIndex === undefined) {
				context.lastIndex = initialIndex;
			}

			if (context.lastIndex === nextIndex) return;

			context.lastIndex = nextIndex;
			runOnJS(syncActiveReelIndex)(nextIndex);
		},
	});

	const getItemLayout = (
		_: ArrayLike<unknown> | null | undefined,
		index: number,
	) => ({
		length: itemStride,
		offset: itemStride * index,
		index,
	});

	const renderItem = ({ item }: ListRenderItemInfo<unknown>) => {
		const reelItem = item as (typeof REEL_ITEMS)[number];

		return (
			<ReelFeedItem
				key={reelItem.id}
				id={reelItem.id}
				profileName={reelItem.profileName}
				handle={reelItem.handle}
				caption={reelItem.caption}
				videoSource={reelItem.videoSource}
				thumbnailSource={reelItem.thumbnailSource}
				isActive={reelItem.id === activeReelId}
				videoWidth={videoWidth}
				videoHeight={videoHeight}
				textColor={theme.text}
				textSecondary={theme.textSecondary}
				actionColor={theme.actionButton}
			/>
		);
	};

	const insets = useSafeAreaInsets();
	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: theme.bg, paddingTop: insets.top },
			]}
		>
			<Transition.FlatList
				data={REEL_ITEMS}
				renderItem={renderItem}
				keyExtractor={(item) => (item as (typeof REEL_ITEMS)[number]).id}
				getItemLayout={getItemLayout}
				initialScrollIndex={initialIndex}
				contentContainerStyle={styles.feedContent}
				showsVerticalScrollIndicator={false}
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				windowSize={3}
				maxToRenderPerBatch={2}
				initialNumToRender={2}
				updateCellsBatchingPeriod={100}
				overScrollMode="never"
				style={styles.list}
				ItemSeparatorComponent={Separator}
			/>
		</View>
	);
}

function Separator() {
	return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	feedContent: {
		paddingBottom: 48,
	},
	list: {
		flex: 1,
	},
	feedItem: {
		gap: FEED_ITEM_INNER_GAP,
	},
	authorRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
	},
	avatar: {
		width: 44,
		height: 44,
		borderRadius: 999,
		borderWidth: 2,
	},
	authorCopy: {
		gap: 2,
	},
	handle: {
		fontSize: 16,
		fontWeight: "700",
	},
	audioMeta: {
		fontSize: 13,
		fontWeight: "500",
	},
	videoFrame: {
		alignSelf: "center",
		overflow: "hidden",
	},
	mediaContainer: {
		flex: 1,
		position: "relative",
		overflow: "hidden",
	},
	mediaFill: {
		...StyleSheet.absoluteFillObject,
	},
	thumbnailFill: {
		...StyleSheet.absoluteFillObject,
		transform: [{ scale: THUMBNAIL_CROP_SCALE }],
	},
	hiddenMedia: {
		opacity: 0,
	},
	metaBlock: {
		height: COPY_HEIGHT,
		paddingHorizontal: 16,
		gap: 8,
	},
	separator: {
		height: FEED_GAP,
	},
	metaLine: {
		fontSize: 13,
		fontWeight: "600",
	},
	caption: {
		fontSize: 15,
		lineHeight: 22,
	},
	captionHandle: {
		fontWeight: "700",
	},
});
