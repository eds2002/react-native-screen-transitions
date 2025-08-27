import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback } from "react";
import { Dimensions, FlatList, ScrollView, Text, View } from "react-native";

import Transition from "react-native-screen-transitions";

const CONTAINER_WIDTH = Dimensions.get("window").width * 0.62;
const CONTAINER_HEIGHT = CONTAINER_WIDTH * 1.3;

const TopPicksSection = () => {
	const renderItem = useCallback(({ index }: { index: number }) => {
		const imageUrl = `https://picsum.photos/id/${237 + index}/400/400`;
		const sharedId = `pick-${index}`;
		return (
			<Transition.Pressable
				sharedBoundTag={sharedId}
				onPress={() =>
					router.push({
						pathname: "/examples/apple-music/[id]",
						params: {
							id: "123",
							sharedId,
							url: imageUrl,
						},
					})
				}
				style={{
					width: CONTAINER_WIDTH,
					height: CONTAINER_HEIGHT,
					backgroundColor: "#f3f4f6",
					overflow: "hidden",
					borderRadius: 14,
				}}
			>
				<Image
					source={{
						uri: imageUrl,
					}}
					style={{
						aspectRatio: 1,
						width: CONTAINER_WIDTH,
						height: CONTAINER_WIDTH,
					}}
				/>
				<View
					style={{
						alignItems: "center",
						gap: 4,
						justifyContent: "center",
						flex: 1,
					}}
				>
					<Text style={{ fontSize: 16, fontWeight: "600" }}>Song title</Text>
					<Text style={{ fontSize: 16, color: "gray" }}>Song Artist</Text>
				</View>
			</Transition.Pressable>
		);
	}, []);

	return (
		<View style={{ overflow: "visible" }}>
			<Text style={{ fontSize: 20, fontWeight: "bold", paddingHorizontal: 16 }}>
				Top picks for you
			</Text>
			<FlatList
				data={Array.from({ length: 4 })}
				renderItem={renderItem}
				horizontal
				contentContainerStyle={{
					padding: 16,
					gap: 12,
				}}
				showsHorizontalScrollIndicator={false}
			/>
		</View>
	);
};

const RecentlyPlayedSection = () => {
	const renderItem = useCallback(({ index }: { index: number }) => {
		const imageUrl = `https://picsum.photos/id/${237 + index}/400/400`;
		const sharedId = `album-${index}`;
		return (
			<Transition.Pressable
				style={{ borderRadius: 8, overflow: "hidden" }}
				sharedBoundTag={sharedId}
				onPress={() =>
					router.push({
						pathname: "/examples/apple-music/[id]",
						params: { id: "123", sharedId, url: imageUrl },
					})
				}
			>
				<Image
					source={{ uri: imageUrl }}
					style={{ width: 160, aspectRatio: 1, height: 160 }}
				/>
			</Transition.Pressable>
		);
	}, []);

	return (
		<View style={{ overflow: "visible" }}>
			<Text style={{ fontSize: 20, fontWeight: "bold", paddingHorizontal: 16 }}>
				Recently Played
			</Text>
			<FlatList
				data={Array.from({ length: 4 })}
				renderItem={renderItem}
				horizontal
				contentContainerStyle={{
					padding: 16,
					gap: 12,
				}}
				showsHorizontalScrollIndicator={false}
			/>
		</View>
	);
};

export default function IndexScreen() {
	return (
		<ScrollView
			automaticallyAdjustContentInsets
			contentInsetAdjustmentBehavior="automatic"
			contentContainerStyle={{ paddingTop: 16, gap: 32 }}
			nestedScrollEnabled
		>
			<TopPicksSection />
			<RecentlyPlayedSection />
		</ScrollView>
	);
}
