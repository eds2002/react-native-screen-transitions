import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import { PLAYLIST_ITEMS, type PlaylistItem } from "./constants";

function PlaylistRow({ item }: { item: PlaylistItem }) {
	const stackType = useResolvedStackType();
	const theme = useTheme();

	return (
		<Transition.Boundary.Trigger
			id={item.id}
			scaleMode="uniform"
			anchor="leading"
			style={[styles.row, { backgroundColor: theme.card }]}
			onPress={() =>
				router.push(
					buildStackPath(stackType, `bounds/music-player/${item.id}`) as never,
				)
			}
		>
			<Transition.Boundary.Target style={styles.artTarget}>
				<Image
					source={item.image}
					style={styles.artwork}
					contentFit="cover"
				/>
			</Transition.Boundary.Target>

			<View style={styles.rowCopy}>
				<View style={styles.rowMeta}>
					<Text style={[styles.eyebrow, { color: theme.textTertiary }]}>
						{item.curator}
					</Text>
					<View
						style={[
							styles.accentDot,
							{ backgroundColor: item.accent },
						]}
					/>
				</View>
				<Text style={[styles.rowTitle, { color: theme.text }]}>
					{item.title}
				</Text>
				<Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
					{item.songCount} songs · {item.duration}
				</Text>
			</View>
		</Transition.Boundary.Trigger>
	);
}

export default function MusicPlayerIndex() {
	const insets = useSafeAreaInsets();
	const theme = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: theme.bg }]}>
			<View style={{ paddingTop: insets.top }}>
				<ScreenHeader
					title="Music Player Zoom"
					subtitle="Row -> fullscreen playlist artwork with Boundary.Trigger/Target"
				/>
			</View>

			<Transition.ScrollView
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: insets.bottom + 28 },
				]}
				showsVerticalScrollIndicator={false}
			>
				<View style={[styles.introCard, { backgroundColor: theme.infoBox }]}>
					<Text
						style={[styles.introEyebrow, { color: theme.infoBoxLabel }]}
					>
						Playlist Focus
					</Text>
					<Text style={[styles.introBody, { color: theme.textSecondary }]}>
						The trigger owns the row press interaction, while the nested target
						limits shared-element measurement to the artwork on the left.
					</Text>
				</View>

				<View style={styles.list}>
					{PLAYLIST_ITEMS.map((item) => (
						<PlaylistRow key={item.id} item={item} />
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
		paddingHorizontal: 20,
		gap: 18,
	},
	introCard: {
		padding: 16,
		borderRadius: 18,
		gap: 8,
	},
	introEyebrow: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
	},
	introBody: {
		fontSize: 14,
		lineHeight: 21,
	},
	list: {
		gap: 12,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		padding: 14,
		borderRadius: 24,
	},
	artTarget: {
		width: 74,
		height: 74,
		borderRadius: 37,
		overflow: "hidden",
		flexShrink: 0,
	},
	artwork: {
		width: "100%",
		height: "100%",
	},
	rowCopy: {
		flex: 1,
		gap: 4,
	},
	rowMeta: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	eyebrow: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 0.9,
		textTransform: "uppercase",
	},
	accentDot: {
		width: 6,
		height: 6,
		borderRadius: 999,
	},
	rowTitle: {
		fontSize: 20,
		fontWeight: "700",
		letterSpacing: -0.4,
	},
	rowSubtitle: {
		fontSize: 13,
		fontWeight: "500",
	},
});
