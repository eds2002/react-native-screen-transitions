import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";
import { getPlaylistById } from "./constants";

export default function MusicPlayerDetail() {
	const { width } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const theme = useTheme();
	const { id } = useLocalSearchParams<{ id?: string }>();
	const playlist = getPlaylistById(id);
	const artworkSize = Math.min(width - 48, 336);

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: theme.bg, paddingTop: insets.top },
			]}
		>
			<ScreenHeader title="Music Player Zoom" subtitle={playlist.title} />

			<Transition.ScrollView
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: insets.bottom + 36 },
				]}
				showsVerticalScrollIndicator={false}
			>
				<Transition.Boundary.View
					id={playlist.id}
					style={[
						styles.heroFrame,
						{
							width: artworkSize,
							height: artworkSize,
							borderRadius: artworkSize / 2,
						},
					]}
				>
					<Image
						source={playlist.image}
						style={[
							styles.heroImage,
							{
								width: artworkSize,
								height: artworkSize,
								borderRadius: artworkSize / 2,
							},
						]}
						contentFit="cover"
					/>
				</Transition.Boundary.View>

				<View style={styles.titleBlock}>
					<Text style={[styles.curator, { color: playlist.accent }]}>
						{playlist.curator}
					</Text>
					<Text style={[styles.title, { color: theme.text }]}>
						{playlist.title}
					</Text>
					<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
						{playlist.songCount} songs · {playlist.duration}
					</Text>
				</View>

				<View style={[styles.descriptionCard, { backgroundColor: theme.card }]}>
					<Text style={[styles.description, { color: theme.textSecondary }]}>
						{playlist.description}
					</Text>
				</View>

				<View style={styles.trackList}>
					{playlist.tracks.map((track, index) => (
						<View
							key={track.title}
							style={[styles.trackRow, { backgroundColor: theme.card }]}
						>
							<Text style={[styles.trackIndex, { color: playlist.accent }]}>
								{String(index + 1).padStart(2, "0")}
							</Text>
							<View style={styles.trackCopy}>
								<Text style={[styles.trackTitle, { color: theme.text }]}>
									{track.title}
								</Text>
								<Text
									style={[styles.trackArtist, { color: theme.textSecondary }]}
								>
									{track.artist}
								</Text>
							</View>
							<Text style={[styles.trackLength, { color: theme.textTertiary }]}>
								{track.length}
							</Text>
						</View>
					))}
				</View>
			</Transition.ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 24,
		gap: 20,
		alignItems: "center",
	},
	heroFrame: {
		overflow: "hidden",
		shadowColor: "#000",
		shadowOpacity: 0.3,
		shadowRadius: 28,
		shadowOffset: { width: 0, height: 18 },
		elevation: 14,
	},
	heroImage: {},
	titleBlock: {
		width: "100%",
		gap: 6,
	},
	curator: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		letterSpacing: -0.7,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "500",
	},
	descriptionCard: {
		width: "100%",
		borderRadius: 22,
		padding: 18,
	},
	description: {
		fontSize: 15,
		lineHeight: 24,
	},
	trackList: {
		width: "100%",
		gap: 10,
	},
	trackRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		borderRadius: 18,
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	trackIndex: {
		width: 26,
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 0.8,
	},
	trackCopy: {
		flex: 1,
		gap: 2,
	},
	trackTitle: {
		fontSize: 15,
		fontWeight: "700",
	},
	trackArtist: {
		fontSize: 13,
		fontWeight: "500",
	},
	trackLength: {
		fontSize: 12,
		fontWeight: "600",
	},
});
