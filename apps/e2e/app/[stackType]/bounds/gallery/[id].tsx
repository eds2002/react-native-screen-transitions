import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import type { ListRenderItemInfo } from "react-native";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import {
	activeGalleryId,
	GALLERY_GROUP,
	GALLERY_ITEMS,
	type GalleryItem,
} from "./constants";

const GALLERY_ITEM_IDS = GALLERY_ITEMS.map((item) => item.id);

function ImagePage({
	item,
	screenWidth,
}: {
	item: GalleryItem;
	screenWidth: number;
}) {
	const aspectRatio = item.width / item.height;
	const imageWidth = screenWidth;
	const imageHeight = screenWidth / aspectRatio;

	return (
		<View style={[styles.page, { width: screenWidth }]}>
			<View style={styles.imageCenter}>
				<Transition.Boundary.View
					id={item.id}
					group={GALLERY_GROUP}
					style={{
						width: imageWidth,
						height: imageHeight,
					}}
					anchor="center"
				>
					<Image
						source={{ uri: item.uri }}
						style={styles.image}
						contentFit="cover"
					/>
				</Transition.Boundary.View>
			</View>
		</View>
	);
}

export default function GalleryDetail() {
	const { width } = useWindowDimensions();
	const { id } = useLocalSearchParams<{ id: string }>();

	const initialIndex = Math.max(
		0,
		GALLERY_ITEMS.findIndex((item) => item.id === id),
	);

	const scrollHandler = useAnimatedScrollHandler(
		{
			onScroll: (event) => {
				"worklet";
				if (width <= 0) return;

				const pageIndex = Math.max(
					0,
					Math.min(
						GALLERY_ITEM_IDS.length - 1,
						Math.round(event.contentOffset.x / width),
					),
				);
				const nextId = GALLERY_ITEM_IDS[pageIndex];

				if (!nextId || activeGalleryId.value === nextId) return;

				activeGalleryId.value = nextId;
			},
		},
		[width],
	);

	const getItemLayout = (_: unknown, index: number) => ({
		length: width,
		offset: width * index,
		index,
	});

	const renderItem = ({ item }: ListRenderItemInfo<GalleryItem>) => (
		<ImagePage item={item} screenWidth={width} />
	);

	const keyExtractor = (item: GalleryItem) => item.id;

	return (
		<View style={styles.root}>
			<Animated.FlatList
				data={GALLERY_ITEMS}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				getItemLayout={getItemLayout}
				initialScrollIndex={initialIndex}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				onScroll={scrollHandler}
				windowSize={3}
				maxToRenderPerBatch={3}
				initialNumToRender={3}
				removeClippedSubviews
				updateCellsBatchingPeriod={100}
				scrollEventThrottle={16}
				decelerationRate="fast"
				overScrollMode="never"
				style={styles.flatList}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	flatList: {
		flex: 1,
	},
	boundaryOverlay: {
		...StyleSheet.absoluteFillObject,
		opacity: 0,
	},
	boundaryCenter: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	page: {
		flex: 1,
	},
	imageCenter: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	image: {
		width: "100%",
		height: "100%",
	},
});
