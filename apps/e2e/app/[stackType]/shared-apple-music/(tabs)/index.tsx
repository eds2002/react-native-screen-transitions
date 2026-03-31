import { Image } from "expo-image";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { PLAYLIST_ITEMS, type PlaylistItem } from "../../bounds/music-player/constants";

const FEATURED_CARD_WIDTH = 240;
const FEATURED_ART_SIZE = FEATURED_CARD_WIDTH;
const FEATURED_CARD_HEIGHT = FEATURED_ART_SIZE + 112;
const RECENT_ART_SIZE = 160;

const TOP_PICKS = PLAYLIST_ITEMS.slice(0, 3);
const RECENTLY_PLAYED = PLAYLIST_ITEMS;

export default function SharedAppleMusicHome() {
	const stackType = useResolvedStackType();

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<Transition.ScrollView
				style={styles.container}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<ScreenHeader
					light
					title="Shared Apple Music"
					subtitle="Deprecated SharedAppleMusic preset inside nested tabs"
				/>

				<MusicSection title="Top picks for you">
					<FlatList
						data={TOP_PICKS}
						horizontal
						keyExtractor={(item) => item.id}
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.horizontalList}
						renderItem={({ item }) => (
							<FeaturedCard item={item} stackType={stackType} />
						)}
					/>
				</MusicSection>

				<MusicSection title="Recently Played">
					<FlatList
						data={RECENTLY_PLAYED}
						horizontal
						keyExtractor={(item) => item.id}
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.horizontalList}
						renderItem={({ item }) => (
							<RecentCard item={item} stackType={stackType} />
						)}
					/>
				</MusicSection>
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

function MusicSection({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{title}</Text>
			{children}
		</View>
	);
}

function FeaturedCard({
	item,
	stackType,
}: {
	item: PlaylistItem;
	stackType: "blank-stack" | "native-stack";
}) {
	const sharedId = `pick-${item.id}`;

	return (
		<Transition.Pressable
			sharedBoundTag={sharedId}
			style={styles.featuredCard}
			onPress={() => {
				router.push({
					pathname: buildStackPath(
						stackType,
						`shared-apple-music/${item.id}`,
					) as never,
					params: {
						sharedId,
					},
				});
			}}
		>
			<Image
				source={item.image}
				style={styles.featuredImage}
				contentFit="cover"
			/>
			<View style={styles.featuredCopy}>
				<Text style={styles.featuredTitle}>{item.title}</Text>
				<Text style={styles.featuredSubtitle}>{item.curator}</Text>
			</View>
		</Transition.Pressable>
	);
}

function RecentCard({
	item,
	stackType,
}: {
	item: PlaylistItem;
	stackType: "blank-stack" | "native-stack";
}) {
	const sharedId = `album-${item.id}`;

	return (
		<Transition.Pressable
			sharedBoundTag={sharedId}
			style={styles.recentCard}
			onPress={() => {
				router.push({
					pathname: buildStackPath(
						stackType,
						`shared-apple-music/${item.id}`,
					) as never,
					params: {
						sharedId,
					},
				});
			}}
		>
			<Image
				source={item.image}
				style={styles.recentImage}
				contentFit="cover"
			/>
		</Transition.Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFF",
	},
	content: {
		paddingBottom: 32,
		gap: 28,
	},
	section: {
		gap: 12,
	},
	sectionTitle: {
		fontSize: 22,
		fontWeight: "800",
		color: "#111827",
		paddingHorizontal: 16,
	},
	horizontalList: {
		paddingHorizontal: 16,
		gap: 12,
	},
	featuredCard: {
		width: FEATURED_CARD_WIDTH,
		height: FEATURED_CARD_HEIGHT,
		backgroundColor: "#F3F4F6",
		borderRadius: 16,
		overflow: "hidden",
	},
	featuredImage: {
		width: FEATURED_ART_SIZE,
		height: FEATURED_ART_SIZE,
	},
	featuredCopy: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
		paddingHorizontal: 16,
	},
	featuredTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#111827",
		textAlign: "center",
	},
	featuredSubtitle: {
		fontSize: 15,
		color: "#6B7280",
		textAlign: "center",
	},
	recentCard: {
		borderRadius: 10,
		overflow: "hidden",
	},
	recentImage: {
		width: RECENT_ART_SIZE,
		height: RECENT_ART_SIZE,
	},
});
