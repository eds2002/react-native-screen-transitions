import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { type ComponentType, useCallback, useState } from "react";
import {
	type FlatListProps,
	type ListRenderItemInfo,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import {
	CARRIED_HANDOFF_ID,
	CARRIED_IMAGE_ASPECT_RATIO,
	CARRIED_IMAGE_SOURCE,
	MATCHED_SCREEN_ASPECT_RATIO,
	MATCHED_SCREEN_DETAIL_WIDTH,
	MATCHED_SCREEN_HANDOFF_MODES,
	MATCHED_SCREEN_PAYLOAD_MODES,
	MATCHED_SCREEN_VIDEOS,
	type MatchedScreenHandoffMode,
	type MatchedScreenPayloadMode,
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
	const [handoffMode, setHandoffMode] =
		useState<MatchedScreenHandoffMode>("auto");
	const [payloadMode, setPayloadMode] =
		useState<MatchedScreenPayloadMode>("single");

	const openCarriedImage = useCallback(() => {
		router.push({
			pathname: buildStackPath(
				stackType,
				"bounds/matched-screen/player",
			) as never,
			params: { handoffMode, id: CARRIED_HANDOFF_ID, payloadMode },
		});
	}, [handoffMode, payloadMode, stackType]);

	const openVideo = useCallback(
		(id: MatchedScreenVideoId) => {
			router.push({
				pathname: buildStackPath(
					stackType,
					"bounds/matched-screen/player",
				) as never,
				params: { handoffMode, id },
			});
		},
		[handoffMode, stackType],
	);

	const renderItem = useCallback(
		({ item }: ListRenderItemInfo<MatchedScreenVideo>) => (
			<VideoCard example={item} onPress={() => openVideo(item.id)} />
		),
		[openVideo],
	);

	const listHeader = (
		<View style={styles.header}>
			<Text style={styles.title}>Overlapping handoff flows</Text>
			<Text style={styles.instructions}>
				Carried-shaped image handoff. The transition stays identical while the
				destination switches between an empty receiver and a second image
				payload.
			</Text>
			<Transition.Boundary
				accessibilityLabel="Open Carried image handoff"
				accessibilityRole="button"
				handoff
				id={CARRIED_HANDOFF_ID}
				onPress={openCarriedImage}
				style={styles.carriedCard}
				testID="matched-screen-open-carried"
			>
				<Image
					contentFit="cover"
					enforceEarlyResizing
					recyclingKey="matched-screen-carried-feed"
					source={CARRIED_IMAGE_SOURCE}
					style={styles.carriedImage}
				/>
			</Transition.Boundary>
			<View style={styles.modePicker}>
				{MATCHED_SCREEN_PAYLOAD_MODES.map((mode) => {
					const selected = mode === payloadMode;

					return (
						<Pressable
							accessibilityRole="button"
							accessibilityState={{ selected }}
							key={mode}
							onPress={() => setPayloadMode(mode)}
							style={({ pressed }) => [
								styles.modeButton,
								selected && styles.modeButtonSelected,
								pressed && styles.modeButtonPressed,
							]}
							testID={`matched-screen-payload-${mode}`}
						>
							<Text
								style={[
									styles.modeButtonText,
									selected && styles.modeButtonTextSelected,
								]}
							>
								{mode === "single" ? "One payload" : "Two payloads"}
							</Text>
						</Pressable>
					);
				})}
			</View>
			<Text style={styles.instructions}>
				Open A, dismiss it, then open B before A finishes closing. Repeat with
				the same card to cover same-ID replacement.
			</Text>
			<View style={styles.modePicker}>
				{MATCHED_SCREEN_HANDOFF_MODES.map((mode) => {
					const selected = mode === handoffMode;

					return (
						<Pressable
							accessibilityRole="button"
							accessibilityState={{ selected }}
							key={mode}
							onPress={() => setHandoffMode(mode)}
							style={({ pressed }) => [
								styles.modeButton,
								selected && styles.modeButtonSelected,
								pressed && styles.modeButtonPressed,
							]}
							testID={`matched-screen-mode-${mode}`}
						>
							<Text
								style={[
									styles.modeButtonText,
									selected && styles.modeButtonTextSelected,
								]}
							>
								{mode === "auto" ? "Auto" : "Explicit target"}
							</Text>
						</Pressable>
					);
				})}
			</View>
			<Text style={styles.modeDescription} testID="matched-screen-mode-label">
				{handoffMode === "auto"
					? "Default ownership — no handoffTarget is returned."
					: "Explicit ownership — Carried returns at 30%; videos return at 50%."}
			</Text>
		</View>
	);

	return (
		<SafeAreaView style={styles.home} edges={["top"]}>
			<StatusBar style="dark" />
			<MatchedScreenFlatList
				contentContainerStyle={styles.listContent}
				data={MATCHED_SCREEN_VIDEOS}
				extraData={`${handoffMode}:${payloadMode}`}
				keyExtractor={(item) => item.id}
				ListHeaderComponent={listHeader}
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
		paddingBottom: 32,
	},
	header: {
		gap: 12,
		maxWidth: MATCHED_SCREEN_DETAIL_WIDTH,
		paddingBottom: 24,
		paddingTop: 24,
		width: "100%",
	},
	title: {
		color: "#17201A",
		fontSize: 22,
		fontWeight: "700",
	},
	instructions: {
		color: "#69716B",
		fontSize: 14,
		lineHeight: 20,
	},
	modePicker: {
		backgroundColor: "#EEF1EF",
		borderCurve: "continuous",
		borderRadius: 12,
		flexDirection: "row",
		padding: 3,
	},
	modeButton: {
		alignItems: "center",
		borderCurve: "continuous",
		borderRadius: 9,
		flex: 1,
		justifyContent: "center",
		minHeight: 38,
		paddingHorizontal: 10,
	},
	modeButtonSelected: {
		backgroundColor: "#17201A",
	},
	modeButtonPressed: {
		opacity: 0.72,
	},
	modeButtonText: {
		color: "#69716B",
		fontSize: 13,
		fontWeight: "700",
	},
	modeButtonTextSelected: {
		color: "#FFFFFF",
	},
	modeDescription: {
		color: "#7D857F",
		fontSize: 12,
		lineHeight: 17,
	},
	card: {
		aspectRatio: MATCHED_SCREEN_ASPECT_RATIO,
		borderCurve: "continuous",
		borderRadius: 28,
		maxWidth: MATCHED_SCREEN_DETAIL_WIDTH,
		width: "100%",
	},
	carriedCard: {
		alignSelf: "center",
		aspectRatio: CARRIED_IMAGE_ASPECT_RATIO,
		borderCurve: "continuous",
		borderRadius: 24,
		overflow: "hidden",
		width: 96,
	},
	carriedImage: {
		height: "100%",
		width: "100%",
	},
	videoCard: {
		overflow: "hidden",
	},
});
