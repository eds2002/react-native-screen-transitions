import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import {
	FlatList,
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { getPlaylistById, PLAYLIST_ITEMS } from "../bounds/music-player/constants";

const FALLBACK_BOUND_TAG = "shared-apple-music-fallback";

const getSingleParam = (value: string | string[] | undefined) =>
	Array.isArray(value) ? value[0] : value;

export default function SharedAppleMusicDetail() {
	const stackType = useResolvedStackType();
	const { width } = useWindowDimensions();
	const params = useLocalSearchParams<{
		id?: string | string[];
		sharedId?: string | string[];
	}>();
	const id = getSingleParam(params.id);
	const sharedId = getSingleParam(params.sharedId) ?? FALLBACK_BOUND_TAG;
	const playlist = getPlaylistById(id);
	const relatedPlaylists = PLAYLIST_ITEMS.filter((item) => item.id !== playlist.id);
	const artSize = width * 0.62;

	return (
		<Transition.MaskedView style={styles.mask}>
			<SafeAreaView style={styles.container} edges={["top"]}>
				<Transition.ScrollView
					style={styles.container}
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
				>
					<ScreenHeader
						light
						title="Shared Apple Music"
						subtitle={playlist.title}
					/>

					<Transition.Pressable
						sharedBoundTag={sharedId}
						onPress={() => router.back()}
						style={[
							styles.heroFrame,
							{
								width: artSize,
								height: artSize,
							},
						]}
					>
						<Image
							source={playlist.image}
							style={styles.heroImage}
							contentFit="cover"
						/>
					</Transition.Pressable>

					<View style={styles.titleBlock}>
						<Text style={styles.title}>{playlist.title}</Text>
						<Text style={[styles.artist, { color: playlist.accent }]}>
							{playlist.curator}
						</Text>
						<Text style={styles.genre}>Indie • Electronic • Pop</Text>
					</View>

					<View style={styles.actionRow}>
						<Pressable style={styles.primaryAction}>
							<Text style={styles.primaryActionText}>Play</Text>
						</Pressable>
						<View style={styles.secondaryAction}>
							<Text style={styles.secondaryActionText}>Shuffle</Text>
						</View>
					</View>

					<Text style={styles.description}>{playlist.description}</Text>

					<View style={styles.trackList}>
						{playlist.tracks.map((track, index) => (
							<View key={track.title} style={styles.trackRow}>
								<Text style={styles.trackIndex}>{index + 1}</Text>
								<View style={styles.trackCopy}>
									<Text style={styles.trackTitle}>{track.title}</Text>
									<Text style={styles.trackArtist}>{track.artist}</Text>
								</View>
								<Text style={styles.trackLength}>{track.length}</Text>
							</View>
						))}
					</View>

					<View style={styles.relatedSection}>
						<Text style={styles.relatedTitle}>Other songs you might like</Text>
						<FlatList
							data={relatedPlaylists}
							horizontal
							keyExtractor={(item) => item.id}
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.relatedList}
							renderItem={({ item }) => {
								const nextSharedId = `album-${item.id}`;

								return (
									<Transition.Pressable
										sharedBoundTag={nextSharedId}
										style={styles.relatedCard}
										onPress={() => {
											router.push({
												pathname: buildStackPath(
													stackType,
													`shared-apple-music/${item.id}`,
												) as never,
												params: {
													sharedId: nextSharedId,
												},
											});
										}}
									>
										<Image
											source={item.image}
											style={styles.relatedImage}
											contentFit="cover"
										/>
									</Transition.Pressable>
								);
							}}
						/>
					</View>
				</Transition.ScrollView>
			</SafeAreaView>
		</Transition.MaskedView>
	);
}

const styles = StyleSheet.create({
	mask: {
		flex: 1,
		backgroundColor: "#FFF",
	},
	container: {
		flex: 1,
		backgroundColor: "#FFF",
	},
	content: {
		alignItems: "center",
		paddingBottom: 120,
	},
	heroFrame: {
		borderRadius: 16,
		overflow: "hidden",
	},
	heroImage: {
		width: "100%",
		height: "100%",
	},
	titleBlock: {
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 20,
		marginTop: 18,
	},
	title: {
		fontSize: 24,
		fontWeight: "800",
		color: "#111827",
	},
	artist: {
		fontSize: 20,
		fontWeight: "700",
	},
	genre: {
		fontSize: 12,
		fontWeight: "700",
		color: "#6B7280",
		textTransform: "uppercase",
	},
	actionRow: {
		flexDirection: "row",
		gap: 8,
		marginHorizontal: 16,
		marginTop: 16,
	},
	primaryAction: {
		flex: 1,
		borderRadius: 14,
		backgroundColor: "#E5E7EB",
		paddingVertical: 14,
		paddingHorizontal: 28,
		alignItems: "center",
		justifyContent: "center",
	},
	primaryActionText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#EF4444",
	},
	secondaryAction: {
		flex: 1,
		borderRadius: 14,
		backgroundColor: "#E5E7EB",
		paddingVertical: 14,
		paddingHorizontal: 28,
		alignItems: "center",
		justifyContent: "center",
	},
	secondaryActionText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#EF4444",
	},
	description: {
		fontSize: 14,
		lineHeight: 22,
		color: "#6B7280",
		marginHorizontal: 20,
		marginTop: 16,
		textAlign: "center",
	},
	trackList: {
		width: "100%",
		marginTop: 20,
	},
	trackRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 0.5,
		borderBottomColor: "#E5E7EB",
		backgroundColor: "#FFF",
	},
	trackIndex: {
		width: 24,
		fontSize: 16,
		color: "#6B7280",
	},
	trackCopy: {
		flex: 1,
		marginLeft: 12,
	},
	trackTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
	},
	trackArtist: {
		fontSize: 13,
		color: "#6B7280",
		marginTop: 2,
	},
	trackLength: {
		fontSize: 12,
		color: "#9CA3AF",
	},
	relatedSection: {
		width: "100%",
		marginTop: 24,
	},
	relatedTitle: {
		fontSize: 20,
		fontWeight: "800",
		color: "#111827",
		paddingHorizontal: 16,
	},
	relatedList: {
		paddingHorizontal: 16,
		paddingTop: 16,
		gap: 12,
	},
	relatedCard: {
		borderRadius: 10,
		overflow: "hidden",
	},
	relatedImage: {
		width: 160,
		height: 160,
	},
});
