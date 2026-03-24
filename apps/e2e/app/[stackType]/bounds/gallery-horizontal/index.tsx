import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	useWindowDimensions,
	View,
} from "react-native";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import {
	activeHorizontalGalleryId,
	GALLERY_ITEMS,
	type GalleryItem,
	HORIZONTAL_GALLERY_GROUP,
} from "./constants";

const GAP = 12;
const PADDING = 16;

function HorizontalGalleryCard({
	item,
	cardWidth,
	cardHeight,
	onPressItem,
}: {
	item: GalleryItem;
	cardWidth: number;
	cardHeight: number;
	onPressItem: (id: string) => void;
}) {
	return (
		<Transition.Boundary.Pressable
			group={HORIZONTAL_GALLERY_GROUP}
			scaleMode="uniform"
			id={item.id}
			style={[
				styles.card,
				{
					width: cardWidth,
					height: cardHeight,
				},
			]}
			onPress={() => {
				onPressItem(item.id);
			}}
		>
			<Image
				source={{ uri: item.uri }}
				style={styles.image}
				contentFit="cover"
			/>
		</Transition.Boundary.Pressable>
	);
}

export default function HorizontalGalleryIndex() {
	const stackType = useResolvedStackType();
	const { width } = useWindowDimensions();
	const scrollRef = useRef<any>(null);
	const skipNextScrollSyncRef = useRef(false);
	const theme = useTheme();
	const cardWidth = width * 0.72;
	const cardHeight = width * 0.92;
	const offsetById = useMemo(
		() =>
			Object.fromEntries(
				GALLERY_ITEMS.map((item, index) => [
					item.id,
					index * (cardWidth + GAP),
				]),
			),
		[cardWidth],
	);

	const scrollToGalleryId = useCallback(
		(id: string, animated: boolean) => {
			const x = offsetById[id];
			if (x === undefined) return;

			const node = scrollRef.current;
			const scrollable =
				typeof node?.scrollTo === "function"
					? node
					: typeof node?.getNode === "function"
						? node.getNode()
						: null;

			if (!scrollable || typeof scrollable.scrollTo !== "function") return;

			scrollable.scrollTo({
				x: Math.max(0, x),
				y: 0,
				animated,
			});
		},
		[offsetById],
	);

	const handlePressItem = useCallback(
		(id: string) => {
			skipNextScrollSyncRef.current = true;
			activeHorizontalGalleryId.value = id;
			router.push(
				buildStackPath(stackType, `bounds/gallery-horizontal/${id}`) as never,
			);
		},
		[stackType],
	);

	const syncActiveIdToSourceScroll = useCallback(
		(id: string) => {
			if (skipNextScrollSyncRef.current) {
				skipNextScrollSyncRef.current = false;
				return;
			}

			scrollToGalleryId(id, false);
		},
		[scrollToGalleryId],
	);

	useAnimatedReaction(
		() => {
			"worklet";
			return activeHorizontalGalleryId.value;
		},
		(nextActiveId, previousActiveId) => {
			"worklet";
			if (!nextActiveId || nextActiveId === previousActiveId) return;
			runOnJS(syncActiveIdToSourceScroll)(nextActiveId);
		},
		[syncActiveIdToSourceScroll],
	);

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Horizontal Gallery"
				subtitle="Horizontal image carousel with shared element zoom"
			/>

			<Transition.ScrollView
				ref={scrollRef}
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				<View style={styles.row}>
					{GALLERY_ITEMS.map((item) => (
						<HorizontalGalleryCard
							key={item.id}
							item={item}
							cardWidth={cardWidth}
							cardHeight={cardHeight}
							onPressItem={handlePressItem}
						/>
					))}
				</View>
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: PADDING,
		paddingBottom: 40,
	},
	row: {
		flexDirection: "row",
		gap: GAP,
		alignItems: "center",
	},
	card: {
		borderRadius: 8,
		overflow: "hidden",
	},
	pressable: {
		flex: 1,
	},
	image: {
		width: "100%",
		height: "100%",
	},
});
