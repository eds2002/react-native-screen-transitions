import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
	interpolate,
	type SharedValue,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Transition from "react-native-screen-transitions";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_WIDTH = SCREEN_WIDTH * 0.75;
const ITEM_HEIGHT = ITEM_WIDTH * 1.2;
const SPACING = 10;

const DUMMY_DATA = [
	{
		key: "1",
		image:
			"https://images.unsplash.com/photo-1517021897933-0e0319cfbc28?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60",
		title: "Aurora",
	},
	{
		key: "2",
		image:
			"https://images.unsplash.com/photo-1682687219800-bba120d709c5?auto=format&fit=crop&w=400&q=60",
		title: "Desert",
	},
	{
		key: "3",
		image:
			"https://images.unsplash.com/photo-1752654977044-db2cffbbebfc?auto=format&fit=crop&w=400&q=60",
		title: "City",
	},
	{
		key: "4",
		image:
			"https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60",
		title: "Abstract",
	},
	{
		key: "5",
		image:
			"https://images.unsplash.com/photo-1743856842985-e1d4fc72a255?auto=format&fit=crop&w=400&q=60",
		title: "Train",
	},
];

const SPACER_ITEM_SIZE = (SCREEN_WIDTH - ITEM_WIDTH) / 2;
const dataWithSpacers = [
	{ key: "left-spacer" },
	...DUMMY_DATA,
	{ key: "right-spacer" },
];

const ParallaxItem = ({
	item,
	index,
	scrollX,
}: {
	item: any;
	index: number;
	scrollX: SharedValue<number>;
}) => {
	const inputRange = [
		(index - 2) * (ITEM_WIDTH + SPACING),
		(index - 1) * (ITEM_WIDTH + SPACING),
		index * (ITEM_WIDTH + SPACING),
	];

	const animatedStyle = useAnimatedStyle(() => {
		const imageTranslateX = interpolate(scrollX.value, inputRange, [
			-ITEM_WIDTH * 0.4,
			0,
			ITEM_WIDTH * 0.4,
		]);

		return {
			transform: [{ translateX: imageTranslateX }],
		};
	});

	const cardAnimatedStyle = useAnimatedStyle(() => {
		const scale = interpolate(scrollX.value, inputRange, [0.9, 1, 0.9]);

		return {
			transform: [{ scale }],
		};
	});

	if (!item.image) {
		return <View style={{ width: SPACER_ITEM_SIZE }} />;
	}

	return (
		<View style={styles.itemContainer}>
			<Animated.View style={[styles.item, cardAnimatedStyle]}>
				<View style={styles.imageContainer}>
					<Animated.Image
						source={{ uri: item.image }}
						style={[styles.image, animatedStyle]}
					/>
				</View>
				<Text
					style={{
						fontSize: 24,
						color: "black",
						fontWeight: "bold",
						alignSelf: "center",
						marginTop: "25%",
					}}
				>
					{item.title}
				</Text>
			</Animated.View>
		</View>
	);
};

export const ParallaxCarousel = () => {
	const scrollX = useSharedValue(0);

	const onScroll = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollX.value = event.contentOffset.x;
		},
	});

	return (
		<Animated.FlatList
			data={dataWithSpacers}
			horizontal
			showsHorizontalScrollIndicator={false}
			keyExtractor={(item) => item.key}
			onScroll={onScroll}
			scrollEventThrottle={16}
			snapToInterval={ITEM_WIDTH + SPACING}
			decelerationRate="fast"
			contentContainerStyle={styles.listContentContainer}
			renderItem={({ item, index }) => (
				<ParallaxItem item={item} index={index} scrollX={scrollX} />
			)}
		/>
	);
};

export default function GalleryModal() {
	const { top } = useSafeAreaInsets();
	return (
		<Transition.ScrollView
			contentContainerStyle={{
				alignItems: "center",
				flex: 1,
				backgroundColor: "#e5e7eb",
				marginTop: top + 24,
				borderRadius: 64,
			}}
			bounces={false}
		>
			<View
				style={{
					marginTop: top / 2,

					width: 40,
					height: 7,
					position: "absolute",
					top: 0,
					borderRadius: 99,
					backgroundColor: "#4b5563",
					alignSelf: "center",
				}}
			/>

			<ParallaxCarousel />
		</Transition.ScrollView>
	);
}

const styles = StyleSheet.create({
	listContentContainer: {
		alignItems: "center",
	},
	itemContainer: {
		width: ITEM_WIDTH + SPACING,
		alignItems: "center",
		justifyContent: "center",
	},
	item: {
		width: ITEM_WIDTH,
		height: ITEM_HEIGHT,
	},
	imageContainer: {
		width: "100%",
		height: "100%",
		overflow: "hidden",
		borderRadius: 36,
	},
	image: {
		width: ITEM_WIDTH * 1.4,
		height: "100%",
		resizeMode: "cover",
		position: "absolute",
		left: -ITEM_WIDTH * 0.2,
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
		textAlign: "center",
		marginTop: 15,
	},
});
