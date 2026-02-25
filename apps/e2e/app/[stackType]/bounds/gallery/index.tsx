import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import {
	activeGalleryId,
	GALLERY_GROUP,
	GALLERY_ITEMS,
	type GalleryItem,
} from "./constants";

const GAP = 3;
const PADDING = 3;

function GalleryThumbnail({
	item,
	columnWidth,
	onPressItem,
}: {
	item: GalleryItem;
	columnWidth: number;
	onPressItem: (id: string) => void;
}) {
	const aspectRatio = item.width / item.height;
	const thumbHeight = columnWidth / aspectRatio;

	return (
		<Transition.Boundary.View
			group={GALLERY_GROUP}
			scaleMode="uniform"
			id={item.id}
			style={[
				styles.thumbnail,
				{
					width: columnWidth,
					height: thumbHeight,
				},
			]}
			pointerEvents="box-none"
		>
			<Pressable
				onPress={() => {
					onPressItem(item.id);
				}}
				style={styles.pressable}
			>
				<Image
					source={{ uri: item.uri }}
					style={styles.image}
					contentFit="cover"
				/>
			</Pressable>
		</Transition.Boundary.View>
	);
}

type MasonryLayout = {
	leftColumn: GalleryItem[];
	rightColumn: GalleryItem[];
	offsetById: Record<string, number>;
};

function buildMasonryLayout(columnWidth: number): MasonryLayout {
	const leftColumn: GalleryItem[] = [];
	const rightColumn: GalleryItem[] = [];
	const offsetById: Record<string, number> = {};
	let leftHeight = 0;
	let rightHeight = 0;

	for (const item of GALLERY_ITEMS) {
		const aspectRatio = item.width / item.height;
		const itemHeight = columnWidth / aspectRatio;

		if (leftHeight <= rightHeight) {
			leftColumn.push(item);
			offsetById[item.id] = leftHeight;
			leftHeight += itemHeight + GAP;
		} else {
			rightColumn.push(item);
			offsetById[item.id] = rightHeight;
			rightHeight += itemHeight + GAP;
		}
	}

	return {
		leftColumn,
		rightColumn,
		offsetById,
	};
}

function MasonryGrid({
	columnWidth,
	leftColumn,
	rightColumn,
	onPressItem,
}: {
	columnWidth: number;
	leftColumn: GalleryItem[];
	rightColumn: GalleryItem[];
	onPressItem: (id: string) => void;
}) {
	return (
		<View style={styles.masonry}>
			<View style={styles.column}>
				{leftColumn.map((item) => (
					<GalleryThumbnail
						key={item.id}
						item={item}
						columnWidth={columnWidth}
						onPressItem={onPressItem}
					/>
				))}
			</View>
			<View style={styles.column}>
				{rightColumn.map((item) => (
					<GalleryThumbnail
						key={item.id}
						item={item}
						columnWidth={columnWidth}
						onPressItem={onPressItem}
					/>
				))}
			</View>
		</View>
	);
}

export default function GalleryIndex() {
	const stackType = useResolvedStackType();
	const { width } = useWindowDimensions();
	const columnWidth = (width - PADDING * 2 - GAP) / 2;
	const scrollRef = useRef<any>(null);
	const skipNextScrollSyncRef = useRef(false);
	const masonryLayout = useMemo(
		() => buildMasonryLayout(columnWidth),
		[columnWidth],
	);

	const scrollToGalleryId = useCallback(
		(id: string, animated: boolean) => {
			const y = masonryLayout.offsetById[id];
			if (y === undefined) return;

			const node = scrollRef.current;
			const scrollable =
				typeof node?.scrollTo === "function"
					? node
					: typeof node?.getNode === "function"
						? node.getNode()
						: null;

			if (!scrollable || typeof scrollable.scrollTo !== "function") return;

			scrollable.scrollTo({
				x: 0,
				y: Math.max(0, y - GAP),
				animated,
			});
		},
		[masonryLayout],
	);

	const handlePressItem = useCallback(
		(id: string) => {
			// Skip the first active-id sync caused by this press so the source list
			// doesn't jump while push transition is starting.
			skipNextScrollSyncRef.current = true;
			activeGalleryId.value = id;
			router.push(buildStackPath(stackType, `bounds/gallery/${id}`) as never);
		},
		[stackType],
	);

	const syncActiveIdToIndexScroll = useCallback(
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
			return activeGalleryId.value;
		},
		(nextActiveId, previousActiveId) => {
			"worklet";
			if (!nextActiveId || nextActiveId === previousActiveId) return;
			runOnJS(syncActiveIdToIndexScroll)(nextActiveId);
		},
		[syncActiveIdToIndexScroll],
	);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Gallery"
				subtitle="Image gallery with shared element zoom"
			/>

			<Transition.ScrollView ref={scrollRef}>
				<MasonryGrid
					columnWidth={columnWidth}
					leftColumn={masonryLayout.leftColumn}
					rightColumn={masonryLayout.rightColumn}
					onPressItem={handlePressItem}
				/>
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#000",
	},
	scrollContent: {
		paddingHorizontal: PADDING,
		paddingBottom: 40,
		overflow: "visible",
	},
	masonry: {
		flexDirection: "row",
		gap: GAP,
		overflow: "visible",
	},
	column: {
		flex: 1,
		gap: GAP,
		overflow: "visible",
	},
	thumbnail: {
		borderRadius: 4,
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
