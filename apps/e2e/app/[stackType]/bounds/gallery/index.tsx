import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
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
}: {
	item: GalleryItem;
	columnWidth: number;
}) {
	const stackType = useResolvedStackType();
	const aspectRatio = item.width / item.height;
	const thumbHeight = columnWidth / aspectRatio;

	return (
		<Transition.Boundary
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
					activeGalleryId.value = item.id;
					router.push(
						buildStackPath(stackType, `bounds/gallery/${item.id}`) as never,
					);
				}}
				style={styles.pressable}
			>
				<Image
					source={{ uri: item.uri }}
					style={styles.image}
					contentFit="cover"
				/>
			</Pressable>
		</Transition.Boundary>
	);
}

function MasonryGrid({ columnWidth }: { columnWidth: number }) {
	const leftColumn: GalleryItem[] = [];
	const rightColumn: GalleryItem[] = [];
	let leftHeight = 0;
	let rightHeight = 0;

	for (const item of GALLERY_ITEMS) {
		const aspectRatio = item.width / item.height;
		const itemHeight = columnWidth / aspectRatio;

		if (leftHeight <= rightHeight) {
			leftColumn.push(item);
			leftHeight += itemHeight + GAP;
		} else {
			rightColumn.push(item);
			rightHeight += itemHeight + GAP;
		}
	}

	return (
		<View style={styles.masonry}>
			<View style={styles.column}>
				{leftColumn.map((item) => (
					<GalleryThumbnail
						key={item.id}
						item={item}
						columnWidth={columnWidth}
					/>
				))}
			</View>
			<View style={styles.column}>
				{rightColumn.map((item) => (
					<GalleryThumbnail
						key={item.id}
						item={item}
						columnWidth={columnWidth}
					/>
				))}
			</View>
		</View>
	);
}

export default function GalleryIndex() {
	const { width } = useWindowDimensions();
	const columnWidth = (width - PADDING * 2 - GAP) / 2;

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Gallery"
				subtitle="Image gallery with shared element zoom"
			/>

			<Transition.ScrollView contentContainerStyle={styles.scrollContent}>
				<MasonryGrid columnWidth={columnWidth} />
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
