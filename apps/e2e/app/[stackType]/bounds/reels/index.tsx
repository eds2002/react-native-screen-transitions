import { Image } from "expo-image";
import { router } from "expo-router";
import {
	type ListRenderItemInfo,
	StyleSheet,
	useWindowDimensions,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import { REEL_ITEMS, REELS_GROUP, selectedId } from "./constants";

const GRID_COLUMNS = 3;
const GRID_GAP = 1;
const GRID_PADDING = 12;
const PHONE_ASPECT_RATIO = 16 / 9;
const PLACEHOLDER_COLOR = "#e3e7e8";
const THUMBNAIL_CROP_SCALE = 1.2;

function ReelCard({
	id,
	thumbnailSource,
	height,
	width,
	onPress,
}: {
	id: string;
	thumbnailSource: number;
	height: number;
	width: number;
	onPress: (id: string) => void;
}) {
	return (
		<Transition.Boundary.Trigger
			id={id}
			group={REELS_GROUP}
			scaleMode="match"
			anchor="center"
			style={[styles.card, { width, height }]}
			onPress={() => onPress(id)}
		>
			<View
				style={[
					styles.mediaContainer,
					{
						backgroundColor: PLACEHOLDER_COLOR,
					},
				]}
			>
				<Image
					source={thumbnailSource}
					style={styles.thumbnailFill}
					contentFit="cover"
					transition={0}
					cachePolicy="memory-disk"
				/>
			</View>
		</Transition.Boundary.Trigger>
	);
}

export default function ReelsIndex() {
	const stackType = useResolvedStackType();
	const theme = useTheme();
	const { width } = useWindowDimensions();

	const cellWidth =
		(width - GRID_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
	const cellHeight = cellWidth * PHONE_ASPECT_RATIO;

	const renderItem = ({ item }: ListRenderItemInfo<unknown>) => {
		const reelItem = item as (typeof REEL_ITEMS)[number];

		return (
			<ReelCard
				key={reelItem.id}
				id={reelItem.id}
				thumbnailSource={reelItem.thumbnailSource}
				width={cellWidth}
				height={cellHeight}
				onPress={(id) => {
					selectedId.value = id;
					router.push({
						pathname: buildStackPath(stackType, "bounds/reels/reel") as never,
						params: { id },
					});
				}}
			/>
		);
	};

	const insets = useSafeAreaInsets();
	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: theme.bg, paddingTop: insets.top },
			]}
		>
			<ScreenHeader
				title="Reels Grid"
				subtitle="3x3 scroll-aware source grid -> grouped reel feed zoom"
			/>

			<Transition.FlatList
				data={REEL_ITEMS}
				renderItem={renderItem}
				keyExtractor={(item) => (item as (typeof REEL_ITEMS)[number]).id}
				numColumns={GRID_COLUMNS}
				columnWrapperStyle={styles.row}
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: 32, paddingHorizontal: GRID_PADDING },
				]}
				showsVerticalScrollIndicator={false}
				scrollEventThrottle={16}
				ItemSeparatorComponent={RowSeparator}
				style={styles.list}
			/>
		</View>
	);
}

function RowSeparator() {
	return <Transition.View style={styles.rowSeparator} />;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingTop: 16,
	},
	list: {
		flex: 1,
	},
	row: {
		gap: GRID_GAP,
	},
	rowSeparator: {
		height: GRID_GAP,
	},
	card: {
		overflow: "hidden",
	},
	mediaContainer: {
		flex: 1,
		position: "relative",
		overflow: "hidden",
	},
	mediaFill: {
		...StyleSheet.absoluteFillObject,
	},
	thumbnailFill: {
		...StyleSheet.absoluteFillObject,
		transform: [{ scale: THUMBNAIL_CROP_SCALE }],
	},
});
