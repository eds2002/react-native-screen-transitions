import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { FlatList, Image, Text, useWindowDimensions, View } from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Transition from "react-native-screen-transitions";
import { SONGS } from "./index";

const OtherSongsSection = ({ otherSongs }: { otherSongs: typeof SONGS }) => {
	const renderItem = useCallback(
		({ index }: { index: number }) => {
			const imageUrl = otherSongs[index].imageUrl;
			const sharedId = `album-${otherSongs[index].id}`;
			return (
				<Transition.Pressable
					style={{ borderRadius: 8, overflow: "hidden" }}
					sharedBoundTag={sharedId}
					onPress={() =>
						router.push({
							pathname: "/examples/apple-music/[id]",
							params: { id: otherSongs[index].id, sharedId, url: imageUrl },
						})
					}
				>
					<Image
						source={{ uri: imageUrl }}
						style={{ width: 160, aspectRatio: 1, height: 160 }}
					/>
				</Transition.Pressable>
			);
		},
		[otherSongs],
	);

	return (
		<View style={{ overflow: "visible" }}>
			<Text style={{ fontSize: 20, fontWeight: "bold", paddingHorizontal: 16 }}>
				Other songs you might like
			</Text>
			<FlatList
				data={otherSongs}
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

const Songs = () => {
	const renderItem = ({ index }: { index: number }) => {
		return (
			<Swipeable
				renderLeftActions={() => (
					<View
						style={{
							backgroundColor: "#6366f1",

							flex: 1,
						}}
					/>
				)}
				renderRightActions={() => (
					<View style={{ backgroundColor: "#f43f5e", flex: 1 }} />
				)}
			>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						paddingHorizontal: 16,
						paddingVertical: 12,
						borderBottomWidth: 0.5,
						borderBottomColor: "#e5e5e5",
						backgroundColor: "white",
						flex: 1,
					}}
				>
					<Text style={{ fontSize: 16, color: "gray", width: 24 }}>
						{index + 1}
					</Text>
					<View style={{ flex: 1, marginLeft: 12 }}>
						<Text style={{ fontSize: 16, fontWeight: "500" }}>
							Song {index + 1}
						</Text>
					</View>
					<Text style={{ fontSize: 20, color: "gray" }}>⋯</Text>
				</View>
			</Swipeable>
		);
	};
	return (
		<FlatList
			data={Array.from({ length: 6 })}
			renderItem={renderItem}
			scrollEnabled={false}
			keyExtractor={(_, index) => index.toString()}
			style={{ width: "100%" }}
			contentContainerStyle={{ paddingBottom: 32 }}
		/>
	);
};

export default function IndexScreen() {
	const { sharedId, url, id } = useLocalSearchParams<{
		sharedId: string;
		url: string;
		id: string;
	}>();

	const otherSongs = SONGS.filter((song) => song.id !== id);

	const { width } = useWindowDimensions();
	const CONTAINER_WIDTH = width * 0.62;

	return (
		<Transition.MaskedView
			style={{
				flex: 1,
				alignItems: "center",
				backgroundColor: "white",
				paddingTop: 100,
				borderRadius: 36,
				marginBottom: -50,
				gap: 24,
			}}
		>
			<Transition.ScrollView
				style={{ flex: 1, width: "100%" }}
				contentContainerStyle={{ paddingBottom: 128 }}
			>
      <Transition.Pressable
					sharedBoundTag={sharedId}
					onPress={router.back}
					style={{
						width: CONTAINER_WIDTH,
						height: CONTAINER_WIDTH,
						borderRadius: 12,
						overflow: "hidden",
						alignSelf: "center",
					}}
				>
					<Image
						source={{ uri: url }}
						style={{
							aspectRatio: 1,
							width: CONTAINER_WIDTH,
							height: CONTAINER_WIDTH,
						}}
					/>
				</Transition.Pressable>
				<View
					style={{ gap: 4, alignItems: "center", justifyContent: "center" }}
				>
					<Text style={{ fontSize: 20, fontWeight: "600" }}>Song title</Text>
					<Text style={{ fontSize: 20, color: "red" }}>Song Artist</Text>
					<Text style={{ fontSize: 12, color: "gray", fontWeight: "bold" }}>
						Hip-Hop/Rap{" "}
					</Text>
					<View
						style={{
							flexDirection: "row",
							gap: 4,
							marginHorizontal: 16,
							marginVertical: 8,
						}}
					>
						<View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
							<View
								style={{
									backgroundColor: "#e5e5e5",
									borderRadius: 12,
									padding: 12,
									flex: 1,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Text
									style={{ fontSize: 16, color: "red", fontWeight: "bold" }}
								>
									Play
								</Text>
							</View>
							<View
								style={{
									backgroundColor: "#e5e5e5",
									borderRadius: 12,
									padding: 12,
									flex: 1,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Text
									style={{ fontSize: 16, color: "red", fontWeight: "bold" }}
								>
									Shuffle
								</Text>
							</View>
						</View>
					</View>
					<Text
						style={{
							fontSize: 14,
							color: "gray",
							marginHorizontal: 16,
							fontWeight: "500",
						}}
					>
						Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
						quos.
					</Text>
				</View>

				<Songs />
				<OtherSongsSection otherSongs={otherSongs} />
			</Transition.ScrollView>
		</Transition.MaskedView>
	);
}
