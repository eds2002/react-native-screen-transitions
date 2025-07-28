import { Image } from "expo-image";
import { router } from "expo-router";
import { memo, useCallback } from "react";
import { Dimensions, ScrollView, View } from "react-native";
import Transition from "react-native-screen-transitions";

const { width } = Dimensions.get("window");
const GRID_PADDING = 4;
const GAP = 2;

// Option 1: Use specific Picsum photo IDs
const generateImageUrl = (id: number) =>
	`https://picsum.photos/id/${id}/400/400`;

const GridItem = ({
	id,
	image,
	style,
}: {
	id: string;
	image: string;
	style: any;
}) => (
	<Transition.Pressable
		sharedBoundTag={id}
		style={[{ backgroundColor: "#f0f0f0" }, style]}
		onPress={() =>
			router.push({
				pathname: "/instagram-example/[id]",
				params: { id, image: image },
			})
		}
	>
		<Image
			source={{ uri: image }}
			style={{ width: "100%", height: "100%", resizeMode: "cover" }}
		/>
	</Transition.Pressable>
);

const itemWidth = (width - GRID_PADDING * 2 - GAP * 2) / 3;
const smallItemHeight = itemWidth;
const largeItemHeight = itemWidth * 2 + GAP;
export default function InstagramGrid() {
	const renderGroup = useCallback(
		(startIndex: number, pattern: "left-large" | "right-large") => {
			const containerWidth = width;
			const largeWidth = containerWidth / 3;
			const smallSectionWidth = (containerWidth * 2) / 3;
			const smallItemWidth = (smallSectionWidth - GAP) / 2;

			if (pattern === "right-large") {
				return (
					<View style={{ flexDirection: "row", marginBottom: GAP }}>
						{/* Left section - 4 small items */}
						<View style={{ width: smallSectionWidth, marginRight: GAP }}>
							<View style={{ flexDirection: "row", marginBottom: GAP }}>
								<GridItem
									id={`instagram-example-${startIndex}`}
									style={{
										height: smallItemWidth,
										width: smallItemWidth,
										marginRight: GAP,
									}}
									image={generateImageUrl(startIndex)}
								/>
								<GridItem
									id={`instagram-example-${startIndex + 1}`}
									style={{ height: smallItemWidth, width: smallItemWidth }}
									image={generateImageUrl(startIndex + 1)}
								/>
							</View>
							<View style={{ flexDirection: "row" }}>
								<GridItem
									id={`instagram-example-${startIndex + 2}`}
									style={{
										height: smallItemWidth,
										width: smallItemWidth,
										marginRight: GAP,
									}}
									image={generateImageUrl(startIndex + 2)}
								/>
								<GridItem
									id={`instagram-example-${startIndex + 3}`}
									style={{ height: smallItemWidth, width: smallItemWidth }}
									image={generateImageUrl(startIndex + 3)}
								/>
							</View>
						</View>

						{/* Right section - 1 large item */}
						<View style={{ width: largeWidth }}>
							<GridItem
								id={`instagram-example-${startIndex + 4}`}
								style={{ height: smallItemWidth * 2 + GAP, width: largeWidth }}
								image={generateImageUrl(startIndex + 4)}
							/>
						</View>
					</View>
				);
			} else {
				// Pattern 2: 1 large (spans 2 rows) + 4 small items in 2x2
				return (
					<View style={{ flexDirection: "row", marginBottom: GAP }}>
						{/* Left column - 1 large item spanning 2 rows */}
						<View style={{ flex: 1, marginRight: GAP }}>
							<GridItem
								id={`instagram-example-${startIndex}`}
								style={{ height: largeItemHeight }}
								image={generateImageUrl(startIndex)}
							/>
						</View>

						{/* Right columns - 4 small items in 2x2 */}
						<View style={{ flex: 2 }}>
							<View style={{ flexDirection: "row", marginBottom: GAP }}>
								<GridItem
									id={`instagram-example-${startIndex + 1}`}
									style={{
										height: smallItemHeight,
										width: smallItemWidth,
										marginRight: GAP,
									}}
									image={generateImageUrl(startIndex + 1)}
								/>
								<GridItem
									id={`instagram-example-${startIndex + 2}`}
									style={{
										height: smallItemHeight,
										width: smallItemWidth,
									}}
									image={generateImageUrl(startIndex + 2)}
								/>
							</View>
							<View style={{ flexDirection: "row" }}>
								<GridItem
									id={`instagram-example-${startIndex + 3}`}
									style={{
										height: smallItemHeight,
										width: smallItemWidth,
										marginRight: GAP,
									}}
									image={generateImageUrl(startIndex + 3)}
								/>
								<GridItem
									id={`instagram-example-${startIndex + 4}`}
									style={{
										height: smallItemHeight,
										width: smallItemWidth,
									}}
									image={generateImageUrl(startIndex + 4)}
								/>
							</View>
						</View>
					</View>
				);
			}
		},
		[],
	);

	return (
		<ScrollView style={{ flex: 1, backgroundColor: "white" }}>
			<View style={{ flex: 1 }}>
				{Array.from({ length: 1 }, (_, groupIndex) => {
					const pattern = groupIndex % 2 === 0 ? "right-large" : "left-large";
					const startIndex = groupIndex * 5; // 5 items per group now

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
