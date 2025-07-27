import { router } from "expo-router";
import { Image, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";

export const data = [
	{
		id: "shared-1",
		image: "https://picsum.photos/400/400?random=1",
		title: "Sunset",
		description: "A beautiful sunset over the ocean",
	},
	{
		id: "shared-2",
		image: "https://picsum.photos/400/400?random=2",
		title: "Forest",
		description: "A beautiful forest with trees and flowers",
	},
	{
		id: "shared-3",
		image: "https://picsum.photos/400/400?random=3",
		title: "Ocean fun",
		description: "A really fun day",
	},
	{
		id: "shared-4",
		image: "https://picsum.photos/400/400?random=4",
		title: "Hiking",
		description: "A beautiful hike in the mountains",
	},
	{
		id: "shared-center",
		image: "https://picsum.photos/400/400?random=5",
		title: "Birds eye",
		description: "uh yeahh birds eye",
	},
	{
		id: "shared-6",
		image: "https://picsum.photos/400/400?random=6",
		title: "Pool?",
		description: "I htink thats what im looking at right.",
	},
	{
		id: "shared-7",
		image: "https://picsum.photos/400/400?random=7",
		title: "Snow Biome",
		description: "Minecraft!!!!!!!!!!!!!!!!!!!",
	},
	{
		id: "shared-8",
		image: "https://picsum.photos/400/400?random=10",
		title: "City",
		description: "A beautiful city",
	},
	{
		id: "shared-9",
		image: "https://picsum.photos/400/400?random=9",
		title: "Window",
		description: "A beautiful window",
	},
];

export default function BoundsExampleA() {
	const renderItem = ({ item }: { item: (typeof data)[number] }) => {
		return (
			<Transition.Pressable
				sharedBoundTag={item.id}
				onPress={() => {
					router.push({
						pathname: "/bounds-example/[id]",
						params: { id: item.id },
					});
				}}
				style={{
					backgroundColor: "#d1d5db",
					height: 110,
					width: 110,
					margin: 5,
					borderRadius: 24,

					overflow: "hidden",
				}}
			>
				<Image
					source={{ uri: item.image }}
					style={{ width: 110, height: 110 }}
				/>
			</Transition.Pressable>
		);
	};

	return (
		<View style={{ flex: 1, padding: 36, alignItems: "center" }}>
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
				<Text
					style={{
						fontSize: 36,
						fontWeight: "600",
						marginBottom: 10,
						color: "#111827",
					}}
				>
					Unsplash Gallery
				</Text>
				<Text
					style={{
						fontSize: 14,
						marginBottom: 10,
						fontWeight: "600",
						opacity: 0.75,
					}}
				>
					Example of shared bounds
				</Text>
			</View>
			<View
				style={{
					flex: 0,
					alignItems: "center",
					justifyContent: "flex-end",
				}}
			>
				<View style={{ flexDirection: "row" }}>
					{renderItem({ item: data[0] })}
					{renderItem({ item: data[1] })}
					{renderItem({ item: data[2] })}
				</View>
				<View style={{ flexDirection: "row" }}>
					{renderItem({ item: data[3] })}
					{renderItem({ item: data[4] })}
					{renderItem({ item: data[5] })}
				</View>
				<View style={{ flexDirection: "row" }}>
					{renderItem({ item: data[6] })}
					{renderItem({ item: data[7] })}
					{renderItem({ item: data[8] })}
				</View>
			</View>
		</View>
	);
}
