import { Ionicons } from "@expo/vector-icons";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	interpolate,
	interpolateColor,
	useAnimatedStyle,
} from "react-native-reanimated";
import { snapTo, useScreenAnimation } from "react-native-screen-transitions";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SNAP = 1.0;
const MAX_HEIGHT = SCREEN_HEIGHT * MAX_SNAP;

// Snap points: [0.2, 0.4, 0.6, 0.8, 1.0]
// Index:        0     1     2     3     4

export default function MultiSnapScreen() {
	const animation = useScreenAnimation();

	const albumArtStyle = useAnimatedStyle(() => {
		const { snapIndex } = animation.value;
		const size = interpolate(
			snapIndex,
			[0, 1, 2, 3, 4],
			[48, 80, 180, 260, 300],
			"clamp",
		);
		const radius = interpolate(snapIndex, [0, 2, 4], [14, 32, 48], "clamp");
		const opacity = interpolate(snapIndex, [0, 1], [0.7, 1], "clamp");
		return {
			width: size,
			height: size,
			borderRadius: radius,
			opacity,
		};
	});

	const titleStyle = useAnimatedStyle(() => {
		const { snapIndex } = animation.value;
		const fontSize = interpolate(snapIndex, [0, 2, 4], [15, 22, 28], "clamp");
		return { fontSize };
	});

	const controlsOpacity = useAnimatedStyle(() => {
		const { snapIndex } = animation.value;
		return { opacity: interpolate(snapIndex, [0, 1.5], [0, 1], "clamp") };
	});

	const extrasOpacity = useAnimatedStyle(() => {
		const { snapIndex } = animation.value;
		return { opacity: interpolate(snapIndex, [2, 3], [0, 1], "clamp") };
	});

	const bgStyle = useAnimatedStyle(() => {
		const { snapIndex } = animation.value;
		const backgroundColor = interpolateColor(
			snapIndex,
			[0, 2, 4],
			["#0D0D1A", "#1A0D2E", "#2E0D1A"],
		);
		return { backgroundColor };
	});

	return (
		<Animated.View
			style={[styles.container, bgStyle, { maxHeight: MAX_HEIGHT }]}
		>
			<View style={styles.handle} />

			{/* Compact: mini bar | Expanded: full player */}
			<View style={styles.playerContent}>
				{/* Album Art */}
				<View style={styles.artContainer}>
					<Animated.View style={[styles.albumArt, albumArtStyle]}>
						<Ionicons
							name="musical-notes"
							size={32}
							color="rgba(255,255,255,0.4)"
						/>
					</Animated.View>
				</View>

				{/* Track Info */}
				<View style={styles.trackInfo}>
					<Animated.Text style={[styles.trackTitle, titleStyle]}>
						Midnight City
					</Animated.Text>
					<Text style={styles.trackArtist}>M83 · Hurry Up, We're Dreaming</Text>
				</View>

				{/* Progress Bar */}
				<Animated.View style={[styles.progressSection, controlsOpacity]}>
					<View style={styles.progressBar}>
						<View style={styles.progressFill} />
					</View>
					<View style={styles.progressLabels}>
						<Text style={styles.progressTime}>1:47</Text>
						<Text style={styles.progressTime}>4:03</Text>
					</View>
				</Animated.View>

				{/* Controls */}
				<Animated.View style={[styles.controls, controlsOpacity]}>
					<Pressable onPress={() => snapTo(0)}>
						<Ionicons name="play-skip-back" size={28} color="#fff" />
					</Pressable>
					<View style={styles.playButton}>
						<Ionicons name="pause" size={32} color="#fff" />
					</View>
					<Pressable onPress={() => snapTo(4)}>
						<Ionicons name="play-skip-forward" size={28} color="#fff" />
					</Pressable>
				</Animated.View>

				{/* Extra controls at larger snaps */}
				<Animated.View style={[styles.extras, extrasOpacity]}>
					<View style={styles.volumeRow}>
						<Ionicons
							name="volume-low"
							size={18}
							color="rgba(255,255,255,0.4)"
						/>
						<View style={styles.volumeBar}>
							<View style={styles.volumeFill} />
						</View>
						<Ionicons
							name="volume-high"
							size={18}
							color="rgba(255,255,255,0.4)"
						/>
					</View>

					<View style={styles.actionRow}>
						<Ionicons name="shuffle" size={22} color="#6C5CE7" />
						<Ionicons name="repeat" size={22} color="rgba(255,255,255,0.35)" />
						<Ionicons name="heart" size={22} color="#E84393" />
						<Ionicons
							name="share-outline"
							size={22}
							color="rgba(255,255,255,0.35)"
						/>
						<Ionicons name="list" size={22} color="rgba(255,255,255,0.35)" />
					</View>
				</Animated.View>

				{/* Snap buttons */}
				<View style={styles.snapButtons}>
					{[
						{ idx: 0, label: "Mini" },
						{ idx: 1, label: "Small" },
						{ idx: 2, label: "Medium" },
						{ idx: 3, label: "Large" },
						{ idx: 4, label: "Full" },
					].map(({ idx, label }) => (
						<Pressable
							key={idx}
							testID={`snap-to-${idx}`}
							style={styles.snapBtn}
							onPress={() => snapTo(idx)}
						>
							<Text style={styles.snapBtnText}>{label}</Text>
						</Pressable>
					))}
				</View>
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		alignItems: "center",
	},
	handle: {
		width: 44,
		height: 5,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 3,
		marginTop: 12,
		marginBottom: 16,
	},
	playerContent: {
		flex: 1,
		width: "100%",
		paddingHorizontal: 24,
		alignItems: "center",
	},
	artContainer: {
		alignItems: "center",
		marginBottom: 20,
	},
	albumArt: {
		backgroundColor: "rgba(255,255,255,0.08)",
		justifyContent: "center",
		alignItems: "center",
	},
	trackInfo: {
		alignItems: "center",
		marginBottom: 24,
		width: "100%",
	},
	trackTitle: {
		fontWeight: "900",
		color: "#fff",
		marginBottom: 4,
	},
	trackArtist: {
		fontSize: 14,
		fontWeight: "600",
		color: "rgba(255,255,255,0.4)",
	},
	progressSection: {
		width: "100%",
		marginBottom: 24,
	},
	progressBar: {
		height: 5,
		backgroundColor: "rgba(255,255,255,0.1)",
		borderRadius: 3,
		marginBottom: 8,
	},
	progressFill: {
		position: "absolute",
		left: 0,
		top: 0,
		bottom: 0,
		width: "44%",
		backgroundColor: "#E84393",
		borderRadius: 3,
	},
	progressLabels: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	progressTime: {
		fontSize: 12,
		fontWeight: "700",
		color: "rgba(255,255,255,0.3)",
	},
	controls: {
		flexDirection: "row",
		alignItems: "center",
		gap: 36,
		marginBottom: 32,
	},
	playButton: {
		width: 72,
		height: 72,
		borderRadius: 36,
		backgroundColor: "#6C5CE7",
		justifyContent: "center",
		alignItems: "center",
	},
	extras: {
		width: "100%",
		gap: 24,
		marginBottom: 24,
	},
	volumeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	volumeBar: {
		flex: 1,
		height: 5,
		backgroundColor: "rgba(255,255,255,0.1)",
		borderRadius: 3,
	},
	volumeFill: {
		position: "absolute",
		left: 0,
		top: 0,
		bottom: 0,
		width: "65%",
		backgroundColor: "rgba(255,255,255,0.35)",
		borderRadius: 3,
	},
	actionRow: {
		flexDirection: "row",
		justifyContent: "space-around",
	},
	snapButtons: {
		flexDirection: "row",
		gap: 6,
	},
	snapBtn: {
		backgroundColor: "rgba(255,255,255,0.08)",
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 8,
	},
	snapBtnText: {
		fontSize: 12,
		fontWeight: "700",
		color: "rgba(255,255,255,0.5)",
	},
});
