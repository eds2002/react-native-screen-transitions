import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import type {
	ListRenderItemInfo,
	NativeScrollEvent,
	NativeSyntheticEvent,
} from "react-native";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import {
	activeGalleryId,
	GALLERY_GROUP,
	GALLERY_ITEMS,
	type GalleryItem,
} from "./constants";

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

	const handleMomentumScrollEnd = (
		event: NativeSyntheticEvent<NativeScrollEvent>,
	) => {
		const offsetX = event.nativeEvent.contentOffset.x;
		const pageIndex = Math.round(offsetX / width);
		const item = GALLERY_ITEMS[pageIndex];
		if (!item) return;

		activeGalleryId.value = item.id;
	};

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
				onMomentumScrollEnd={handleMomentumScrollEnd}
				windowSize={1}
				maxToRenderPerBatch={1}
				initialNumToRender={1}
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
