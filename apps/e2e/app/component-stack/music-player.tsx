import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ScreenInterpolationProps } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import type { ComponentStackScreenProps } from "react-native-screen-transitions/component-stack";
import { createComponentStackNavigator } from "react-native-screen-transitions/component-stack";
import { ScreenHeader } from "@/components/screen-header";

type ParamList = {
	list: undefined;
	player: undefined;
};

type Props = ComponentStackScreenProps<ParamList>;

const Stack = createComponentStackNavigator<ParamList>();

const TRACKS = [
	{ title: "Bohemian Rhapsody", artist: "Queen", duration: "5:55" },
	{ title: "Stairway to Heaven", artist: "Led Zeppelin", duration: "8:02" },
	{ title: "Hotel California", artist: "Eagles", duration: "6:30" },
];

const transitionSpec = {
	open: { damping: 30, stiffness: 300, mass: 1 },
	close: { damping: 30, stiffness: 300, mass: 1 },
};

const slideUpInterpolator = (props: ScreenInterpolationProps) => {
	"worklet";
	const { progress, layouts } = props;
	const { height } = layouts.screen;

	const translateY = interpolate(progress, [0, 1], [height, 0], "clamp");

	return {
		contentStyle: {
			transform: [{ translateY }],
		},
	};
};

function TrackList({ navigation }: Props) {
	return (
		<View style={styles.listScreen}>
			<ScreenHeader
				title="Music Player"
				subtitle="Tap a track to open player. Swipe down to close."
			/>
			<View style={styles.trackList}>
				{TRACKS.map((track, i) => (
					<Transition.Pressable
						key={i.toString()}
						style={styles.trackItem}
						onPress={() => navigation.push("player")}
					>
						<View style={styles.trackArt}>
							<Ionicons name="musical-notes" size={24} color="#fff" />
						</View>
						<View style={styles.trackInfo}>
							<Text style={styles.trackTitle}>{track.title}</Text>
							<Text style={styles.trackArtist}>{track.artist}</Text>
						</View>
						<Text style={styles.trackDuration}>{track.duration}</Text>
					</Transition.Pressable>
				))}
			</View>
		</View>
	);
}

function PlayerScreen({ navigation }: Props) {
	const insets = useSafeAreaInsets();
	const track = TRACKS[0];

	return (
		<View
			style={[
				styles.playerScreen,
				{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
			]}
		>
			<View style={styles.playerHeader}>
				<Transition.Pressable onPress={() => navigation.goBack()} hitSlop={8}>
					<Ionicons name="chevron-down" size={28} color="#fff" />
				</Transition.Pressable>
				<Text style={styles.playerHeaderTitle}>Now Playing</Text>
				<View style={{ width: 28 }} />
			</View>

			<View style={styles.playerContent}>
				<View style={styles.albumArt}>
					<Ionicons name="musical-notes" size={80} color="#fff" />
				</View>

				<Text style={styles.playerTitle}>{track.title}</Text>
				<Text style={styles.playerArtist}>{track.artist}</Text>

				<View style={styles.progressContainer}>
					<View style={styles.progressBar}>
						<View style={[styles.progressFill, { width: "35%" }]} />
					</View>
					<View style={styles.progressTime}>
						<Text style={styles.timeText}>2:04</Text>
						<Text style={styles.timeText}>{track.duration}</Text>
					</View>
				</View>

				<View style={styles.controls}>
					<Transition.Pressable hitSlop={12}>
						<Ionicons name="play-skip-back" size={32} color="#fff" />
					</Transition.Pressable>
					<Transition.Pressable style={styles.playButton} hitSlop={12}>
						<Ionicons name="play" size={36} color="#000" />
					</Transition.Pressable>
					<Transition.Pressable hitSlop={12}>
						<Ionicons name="play-skip-forward" size={32} color="#fff" />
					</Transition.Pressable>
				</View>
			</View>
		</View>
	);
}

export default function MusicPlayerDemo() {
	return (
		<View style={styles.container}>
			<Stack.Navigator initialRouteName="list">
				<Stack.Screen
					name="list"
					component={TrackList}
					options={{ gestureEnabled: false }}
				/>
				<Stack.Screen
					name="player"
					component={PlayerScreen}
					options={{
						screenStyleInterpolator: slideUpInterpolator,
						transitionSpec,
						gestureEnabled: true,
						gestureDirection: "vertical",
					}}
				/>
			</Stack.Navigator>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	listScreen: {
		flex: 1,
		backgroundColor: "#121212",
	},
	trackList: {
		padding: 16,
		gap: 12,
	},
	trackItem: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#1e1e1e",
		borderRadius: 12,
		padding: 12,
		borderWidth: 1,
		borderColor: "#333",
	},
	trackArt: {
		width: 48,
		height: 48,
		borderRadius: 8,
		backgroundColor: "#1DB954",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	trackInfo: {
		flex: 1,
	},
	trackTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 4,
	},
	trackArtist: {
		fontSize: 14,
		color: "#888",
	},
	trackDuration: {
		fontSize: 14,
		color: "#666",
	},
	playerScreen: {
		flex: 1,
		backgroundColor: "#121212",
	},
	playerHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		marginBottom: 24,
	},
	playerHeaderTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#888",
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	playerContent: {
		flex: 1,
		paddingHorizontal: 32,
		alignItems: "center",
	},
	albumArt: {
		width: "100%",
		aspectRatio: 1,
		borderRadius: 16,
		backgroundColor: "#1DB954",
		marginBottom: 32,
		justifyContent: "center",
		alignItems: "center",
	},
	playerTitle: {
		fontSize: 24,
		fontWeight: "700",
		color: "#fff",
		marginBottom: 8,
		textAlign: "center",
	},
	playerArtist: {
		fontSize: 18,
		color: "#888",
		marginBottom: 32,
	},
	progressContainer: {
		width: "100%",
		marginBottom: 32,
	},
	progressBar: {
		height: 4,
		backgroundColor: "#333",
		borderRadius: 2,
		marginBottom: 8,
	},
	progressFill: {
		height: "100%",
		backgroundColor: "#1DB954",
		borderRadius: 2,
	},
	progressTime: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	timeText: {
		fontSize: 12,
		color: "#888",
	},
	controls: {
		flexDirection: "row",
		alignItems: "center",
		gap: 48,
	},
	playButton: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: "#fff",
		justifyContent: "center",
		alignItems: "center",
	},
});
