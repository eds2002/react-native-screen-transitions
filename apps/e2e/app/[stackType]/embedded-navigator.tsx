import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ScreenInterpolationProps } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import {
	type BlankStackScreenProps,
	createBlankStackNavigator,
} from "react-native-screen-transitions/blank-stack";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

// ─── Data ────────────────────────────────────────────────────────────────────

const ALBUMS = [
	{
		id: "a1",
		title: "Midnight Drive",
		artist: "Neon Pulse",
		color: "#6366F1",
		tracks: ["Ignition", "Highway Glow", "Rearview", "Exit 99"],
	},
	{
		id: "a2",
		title: "Soft Focus",
		artist: "Luma",
		color: "#EC4899",
		tracks: ["Haze", "Bloom", "Drift", "Still Frame"],
	},
	{
		id: "a3",
		title: "Concrete Garden",
		artist: "Moss",
		color: "#10B981",
		tracks: ["Roots", "Overgrown", "Crack Light", "Rain Delay"],
	},
];

// ─── Param list ──────────────────────────────────────────────────────────────

type PlayerParamList = {
	albums: undefined;
	tracks: { albumId: string };
	playing: { albumId: string; trackIndex: number };
};

type AlbumsScreenProps = BlankStackScreenProps<PlayerParamList, "albums">;
type TracksScreenProps = BlankStackScreenProps<PlayerParamList, "tracks">;
type PlayingScreenProps = BlankStackScreenProps<PlayerParamList, "playing">;

// ─── Navigator ───────────────────────────────────────────────────────────────

const PlayerStack = createBlankStackNavigator<PlayerParamList>();

// ─── Interpolators ───────────────────────────────────────────────────────────

const slideHorizontal = (props: ScreenInterpolationProps) => {
	"worklet";
	const { progress, layouts } = props;
	const w = layouts.screen.width;

	return {
		content: {
			style: {
				transform: [
					{
						translateX: interpolate(progress, [0, 1, 2], [w, 0, -w * 0.25]),
					},
				],
			},
		},
	};
};

const slideUp = (props: ScreenInterpolationProps) => {
	"worklet";
	const { progress, layouts, focused } = props;
	const h = layouts.screen.height;

	return {
		content: {
			style: {
				transform: [
					{
						translateY: interpolate(progress, [0, 1, 2], [h, 0, 0]),
					},
				],
				borderRadius: interpolate(progress, [0, 0.5, 1], [24, 24, 0]),
			},
		},
		backdrop: {
			style: {
				backgroundColor: "black",
				opacity: focused ? interpolate(progress, [0, 1], [0, 0.5]) : 0,
			},
		},
	};
};

const transitionSpec = {
	open: Transition.Specs.DefaultSpec,
	close: Transition.Specs.DefaultSpec,
};

// ─── Screens ─────────────────────────────────────────────────────────────────

function AlbumsScreen({ navigation }: AlbumsScreenProps) {
	const theme = useTheme();

	return (
		<View style={[styles.screen, { backgroundColor: theme.surface }]}>
			<Text style={[styles.screenTitle, { color: theme.text }]}>Library</Text>
			<Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
				Pick an album to browse its tracks
			</Text>
			<View style={styles.albumList}>
				{ALBUMS.map((album) => (
					<Pressable
						key={album.id}
						style={({ pressed }) => [
							styles.albumRow,
							{
								backgroundColor: pressed ? theme.cardPressed : theme.card,
							},
						]}
						onPress={() => navigation.push("tracks", { albumId: album.id })}
					>
						<View style={[styles.albumArt, { backgroundColor: album.color }]}>
							<Ionicons name="musical-notes" size={20} color="white" />
						</View>
						<View style={styles.albumInfo}>
							<Text style={[styles.albumTitle, { color: theme.text }]}>
								{album.title}
							</Text>
							<Text
								style={[styles.albumArtist, { color: theme.textSecondary }]}
							>
								{album.artist} · {album.tracks.length} tracks
							</Text>
						</View>
						<Ionicons
							name="chevron-forward"
							size={16}
							color={theme.textTertiary}
						/>
					</Pressable>
				))}
			</View>
		</View>
	);
}

function TracksScreen({ navigation, route }: TracksScreenProps) {
	const theme = useTheme();
	const album = ALBUMS.find((a) => a.id === route.params?.albumId);

	if (!album) return null;

	return (
		<View style={[styles.screen, { backgroundColor: theme.surface }]}>
			<Pressable
				onPress={() => navigation.goBack()}
				hitSlop={8}
				style={[styles.backButton, { backgroundColor: theme.secondaryButton }]}
			>
				<Ionicons name="arrow-back" size={18} color={theme.text} />
			</Pressable>

			<View style={[styles.albumHero, { backgroundColor: album.color }]}>
				<Ionicons name="disc" size={40} color="white" />
				<Text style={styles.heroTitle}>{album.title}</Text>
				<Text style={styles.heroArtist}>{album.artist}</Text>
			</View>

			<View style={styles.trackList}>
				{album.tracks.map((track, i) => (
					<Pressable
						key={track}
						style={({ pressed }) => [
							styles.trackRow,
							{
								backgroundColor: pressed ? theme.cardPressed : theme.card,
							},
						]}
						onPress={() =>
							navigation.push("playing", {
								albumId: album.id,
								trackIndex: i,
							})
						}
					>
						<Text style={[styles.trackNumber, { color: theme.textTertiary }]}>
							{i + 1}
						</Text>
						<Text style={[styles.trackName, { color: theme.text }]}>
							{track}
						</Text>
						<Ionicons name="play-circle" size={22} color={album.color} />
					</Pressable>
				))}
			</View>
		</View>
	);
}

function PlayingScreen({ navigation, route }: PlayingScreenProps) {
	const theme = useTheme();
	const album = ALBUMS.find((a) => a.id === route.params?.albumId);
	const trackIndex = route.params?.trackIndex ?? 0;

	if (!album) return null;
	const track = album.tracks[trackIndex];

	return (
		<View
			style={[
				styles.screen,
				styles.playingScreen,
				{ backgroundColor: theme.surface },
			]}
		>
			<Pressable
				onPress={() => navigation.goBack()}
				hitSlop={8}
				style={[styles.backButton, { backgroundColor: theme.secondaryButton }]}
			>
				<Ionicons name="chevron-down" size={18} color={theme.text} />
			</Pressable>

			<View style={styles.playingBody}>
				<View style={[styles.nowPlayingArt, { backgroundColor: album.color }]}>
					<Ionicons name="musical-note" size={56} color="white" />
				</View>
				<Text style={[styles.nowPlayingTrack, { color: theme.text }]}>
					{track}
				</Text>
				<Text style={[styles.nowPlayingAlbum, { color: theme.textSecondary }]}>
					{album.title} · {album.artist}
				</Text>

				<View style={styles.controls}>
					<Pressable
						onPress={() => {
							if (trackIndex > 0) {
								navigation.replace("playing", {
									albumId: album.id,
									trackIndex: trackIndex - 1,
								});
							}
						}}
						style={[
							styles.controlButton,
							{ opacity: trackIndex > 0 ? 1 : 0.3 },
						]}
					>
						<Ionicons name="play-skip-back" size={28} color={theme.text} />
					</Pressable>
					<View style={[styles.playButton, { backgroundColor: album.color }]}>
						<Ionicons name="pause" size={30} color="white" />
					</View>
					<Pressable
						onPress={() => {
							if (trackIndex < album.tracks.length - 1) {
								navigation.replace("playing", {
									albumId: album.id,
									trackIndex: trackIndex + 1,
								});
							}
						}}
						style={[
							styles.controlButton,
							{
								opacity: trackIndex < album.tracks.length - 1 ? 1 : 0.3,
							},
						]}
					>
						<Ionicons name="play-skip-forward" size={28} color={theme.text} />
					</Pressable>
				</View>
			</View>

			<Text style={[styles.playingNote, { color: theme.textTertiary }]}>
				Track {trackIndex + 1} of {album.tracks.length}
			</Text>
		</View>
	);
}

// ─── Embedded navigator ──────────────────────────────────────────────────────

function MiniPlayer() {
	return (
		<PlayerStack.Navigator
			independent
			enableNativeScreens
			initialRouteName="albums"
		>
			<PlayerStack.Screen
				name="albums"
				component={AlbumsScreen}
				options={{ gestureEnabled: false }}
			/>
			<PlayerStack.Screen
				name="tracks"
				component={TracksScreen}
				options={{
					screenStyleInterpolator: slideHorizontal,
					transitionSpec,
					gestureEnabled: true,
					gestureDirection: "horizontal",
				}}
			/>
			<PlayerStack.Screen
				name="playing"
				component={PlayingScreen}
				options={{
					screenStyleInterpolator: slideUp,
					transitionSpec,
					gestureEnabled: true,
					gestureDirection: "vertical",
				}}
			/>
		</PlayerStack.Navigator>
	);
}

// ─── Outer screen ────────────────────────────────────────────────────────────

export default function EmbeddedNavigatorExample() {
	const theme = useTheme();
	const insets = useSafeAreaInsets();

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: theme.bg, paddingTop: insets.top },
			]}
		>
			<ScreenHeader
				title="Embedded Navigator"
				subtitle="Independent blank stack with nested navigation"
			/>

			<View style={styles.description}>
				<View style={[styles.infoBox, { backgroundColor: theme.infoBox }]}>
					<Text style={[styles.infoTitle, { color: theme.infoBoxLabel }]}>
						How it works
					</Text>
					<Text style={[styles.infoText, { color: theme.textSecondary }]}>
						A{" "}
						<Text style={[styles.highlight, { color: theme.text }]}>
							PlayerStack.Navigator
						</Text>{" "}
						with{" "}
						<Text style={[styles.highlight, { color: theme.text }]}>
							independent
						</Text>{" "}
						runs its own navigation history inside the outer stack. Browse
						albums, view tracks, and play — all without affecting the parent
						route.
					</Text>
				</View>
			</View>

			<View style={[styles.playerCard, { backgroundColor: theme.surface }]}>
				<MiniPlayer />
			</View>
		</View>
	);
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	description: {
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	infoBox: {
		borderRadius: 20,
		padding: 14,
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: "700",
		marginBottom: 6,
	},
	infoText: {
		fontSize: 13,
		lineHeight: 19,
	},
	highlight: {
		fontWeight: "700",
	},
	playerCard: {
		flex: 1,
		marginHorizontal: 16,
		marginBottom: 16,
		borderRadius: 24,
		overflow: "hidden",
	},

	// Shared screen styles
	screen: {
		flex: 1,
		padding: 18,
	},
	screenTitle: {
		fontSize: 22,
		fontWeight: "700",
		marginBottom: 4,
	},
	screenSubtitle: {
		fontSize: 13,
		marginBottom: 18,
	},
	backButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},

	// Albums
	albumList: {
		gap: 10,
	},
	albumRow: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 18,
		gap: 12,
	},
	albumArt: {
		width: 44,
		height: 44,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	albumInfo: {
		flex: 1,
	},
	albumTitle: {
		fontSize: 15,
		fontWeight: "600",
		marginBottom: 2,
	},
	albumArtist: {
		fontSize: 12,
	},

	// Album hero
	albumHero: {
		borderRadius: 20,
		padding: 20,
		alignItems: "center",
		gap: 6,
		marginBottom: 18,
	},
	heroTitle: {
		color: "white",
		fontSize: 18,
		fontWeight: "700",
	},
	heroArtist: {
		color: "rgba(255,255,255,0.75)",
		fontSize: 13,
	},

	// Tracks
	trackList: {
		gap: 8,
	},
	trackRow: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 16,
		gap: 12,
	},
	trackNumber: {
		width: 20,
		fontSize: 13,
		fontWeight: "600",
		textAlign: "center",
	},
	trackName: {
		flex: 1,
		fontSize: 15,
		fontWeight: "500",
	},

	// Now playing
	playingScreen: {
		justifyContent: "space-between",
	},
	playingBody: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
	},
	nowPlayingArt: {
		width: 180,
		height: 180,
		borderRadius: 32,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	nowPlayingTrack: {
		fontSize: 22,
		fontWeight: "700",
	},
	nowPlayingAlbum: {
		fontSize: 14,
	},
	controls: {
		flexDirection: "row",
		alignItems: "center",
		gap: 28,
		marginTop: 24,
	},
	controlButton: {
		padding: 8,
	},
	playButton: {
		width: 60,
		height: 60,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
	},
	playingNote: {
		fontSize: 12,
		textAlign: "center",
		paddingBottom: 8,
	},
});
