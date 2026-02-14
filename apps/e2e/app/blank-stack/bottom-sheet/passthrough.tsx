import { Ionicons } from "@expo/vector-icons";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SNAP = 0.35;
const MAX_HEIGHT = SCREEN_HEIGHT * MAX_SNAP;

export default function PassthroughScreen() {
	return (
		<View style={styles.container}>
			<View style={[styles.sheet, { maxHeight: MAX_HEIGHT }]}>
				<View style={styles.handle} />

				{/* Now Playing Bar */}
				<View style={styles.nowPlaying}>
					<View style={styles.albumThumb}>
						<Ionicons name="musical-notes" size={20} color="#E84393" />
					</View>
					<View style={styles.trackInfo}>
						<Text style={styles.trackTitle}>Blinding Lights</Text>
						<Text style={styles.trackArtist}>The Weeknd</Text>
					</View>
					<Pressable style={styles.controlBtn}>
						<Ionicons name="play" size={22} color="#fff" />
					</Pressable>
					<Pressable style={styles.controlBtn}>
						<Ionicons
							name="play-skip-forward"
							size={20}
							color="rgba(255,255,255,0.5)"
						/>
					</Pressable>
				</View>

				{/* Progress */}
				<View style={styles.progressBar}>
					<View style={styles.progressFill} />
				</View>

				{/* Quick Queue */}
				<Text style={styles.queueLabel}>Up Next</Text>
				<View style={styles.queueItem}>
					<View style={[styles.queueThumb, { backgroundColor: "#6C5CE720" }]}>
						<Ionicons name="musical-note" size={16} color="#6C5CE7" />
					</View>
					<Text style={styles.queueTitle}>Save Your Tears</Text>
					<Text style={styles.queueArtist}>The Weeknd</Text>
				</View>
				<View style={styles.queueItem}>
					<View style={[styles.queueThumb, { backgroundColor: "#00B89420" }]}>
						<Ionicons name="musical-note" size={16} color="#00B894" />
					</View>
					<Text style={styles.queueTitle}>Levitating</Text>
					<Text style={styles.queueArtist}>Dua Lipa</Text>
				</View>

				<Text style={styles.hint}>
					Tap behind this sheet — touches pass through!
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	sheet: {
		flex: 1,
		backgroundColor: "#0D0D1A",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		paddingHorizontal: 20,
		paddingTop: 10,
	},
	handle: {
		width: 44,
		height: 5,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 3,
		alignSelf: "center",
		marginBottom: 14,
	},
	nowPlaying: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 12,
	},
	albumThumb: {
		width: 48,
		height: 48,
		borderRadius: 14,
		backgroundColor: "#E8439320",
		justifyContent: "center",
		alignItems: "center",
	},
	trackInfo: {
		flex: 1,
	},
	trackTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#fff",
	},
	trackArtist: {
		fontSize: 13,
		fontWeight: "600",
		color: "rgba(255,255,255,0.4)",
		marginTop: 2,
	},
	controlBtn: {
		width: 40,
		height: 40,
		borderRadius: 14,
		backgroundColor: "rgba(255,255,255,0.06)",
		justifyContent: "center",
		alignItems: "center",
	},
	progressBar: {
		height: 4,
		backgroundColor: "rgba(255,255,255,0.08)",
		borderRadius: 2,
		marginBottom: 14,
	},
	progressFill: {
		position: "absolute",
		left: 0,
		top: 0,
		bottom: 0,
		width: "62%",
		backgroundColor: "#E84393",
		borderRadius: 2,
	},
	queueLabel: {
		fontSize: 12,
		fontWeight: "800",
		color: "rgba(255,255,255,0.3)",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 10,
	},
	queueItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 8,
	},
	queueThumb: {
		width: 36,
		height: 36,
		borderRadius: 10,
		justifyContent: "center",
		alignItems: "center",
	},
	queueTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "rgba(255,255,255,0.7)",
		flex: 1,
	},
	queueArtist: {
		fontSize: 12,
		fontWeight: "600",
		color: "rgba(255,255,255,0.3)",
	},
	hint: {
		fontSize: 11,
		fontWeight: "600",
		color: "rgba(255,255,255,0.2)",
		textAlign: "center",
		marginTop: 8,
	},
});
