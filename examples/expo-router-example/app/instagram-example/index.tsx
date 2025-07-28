import { router } from "expo-router";
import React from "react";
import {
	Dimensions,
	Image,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import Transition from "react-native-screen-transitions";

const { width } = Dimensions.get("window");
const GRID_PADDING = 4;
const GAP = 2;

// Mock image URLs - you can replace with your own
const generateImageUrl = (id: number) =>
	`https://picsum.photos/400/400?random=${id}`;

const GridItem = ({ id, style }: { id: number; style: any }) => (
	<TouchableOpacity
		style={[{ backgroundColor: "#f0f0f0" }, style]}
		onPress={() => router.push(`/instagram-example/${id}`)}
	>
		<Transition.View sharedBoundTag={`image-${id}`} style={{ flex: 1 }}>
			<Image
				source={{ uri: generateImageUrl(id) }}
				style={{ flex: 1 }}
				resizeMode="cover"
			/>
		</Transition.View>
	</TouchableOpacity>
);

export default function InstagramGrid() {
	const itemWidth = (width - GRID_PADDING * 2 - GAP * 2) / 3;
	const smallItemHeight = itemWidth;
	const largeItemHeight = itemWidth * 2 + GAP;

	const renderGroup = (
		startIndex: number,
		pattern: "left-large" | "right-large",
	) => {
		if (pattern === "right-large") {
			// Pattern 1: Two small squares on left, one large on right
			return (
				<View style={{ flexDirection: "row", marginBottom: GAP }}>
					{/* Left column - 2 small items */}
					<View style={{ flex: 2, marginRight: GAP }}>
						<GridItem
							id={startIndex}
							style={{ height: smallItemHeight, marginBottom: GAP }}
						/>
						<GridItem id={startIndex + 1} style={{ height: smallItemHeight }} />
					</View>

					{/* Right column - 1 large item */}
					<View style={{ flex: 1 }}>
						<GridItem id={startIndex + 2} style={{ height: largeItemHeight }} />
					</View>
				</View>
			);
		} else {
			// Pattern 2: One large on left, two small on right
			return (
				<View style={{ flexDirection: "row", marginBottom: GAP }}>
					{/* Left column - 1 large item */}
					<View style={{ flex: 1, marginRight: GAP }}>
						<GridItem id={startIndex} style={{ height: largeItemHeight }} />
					</View>

					{/* Right column - 2 small items */}
					<View style={{ flex: 2 }}>
						<GridItem
							id={startIndex + 1}
							style={{ height: smallItemHeight, marginBottom: GAP }}
						/>
						<GridItem id={startIndex + 2} style={{ height: smallItemHeight }} />
					</View>
				</View>
			);
		}
	};

	return (
		<ScrollView style={{ flex: 1, backgroundColor: "white" }}>
			<View style={{ padding: GRID_PADDING }}>
				{Array.from({ length: 20 }, (_, groupIndex) => {
					const pattern = groupIndex % 2 === 0 ? "right-large" : "left-large";
					const startIndex = groupIndex * 3;

					return (
						<View key={groupIndex.toString()}>
							{renderGroup(startIndex, pattern)}
						</View>
					);
				})}
			</View>
		</ScrollView>
	);
}
