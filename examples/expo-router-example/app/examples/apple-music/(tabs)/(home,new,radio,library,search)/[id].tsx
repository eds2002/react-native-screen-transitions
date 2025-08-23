import { router, useLocalSearchParams } from "expo-router";
import { FlatList, Image, Text, useWindowDimensions, View } from "react-native";
import Transition from "react-native-screen-transitions";

export default function IndexScreen() {
	const { id, sharedId, url } = useLocalSearchParams<{
		id: string;
		sharedId: string;
		url: string;
	}>();

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
				contentContainerStyle={{ paddingBottom: 32 }}
			>
				<Transition.Pressable
					sharedBoundTag={sharedId}
					onPress={router.back}
					style={{
						width: CONTAINER_WIDTH,
						height: CONTAINER_WIDTH,
						borderRadius: 36,
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
				<FlatList
					data={Array.from({ length: 20 })}
					renderItem={({ index }) => (
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								paddingHorizontal: 16,
								paddingVertical: 12,
								borderBottomWidth: 0.5,
								borderBottomColor: "#e5e5e5",
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
					)}
					scrollEnabled={false}
					keyExtractor={(item, index) => index.toString()}
					style={{ width: "100%" }}
					contentContainerStyle={{ paddingBottom: 32 }}
				/>
			</Transition.ScrollView>
		</Transition.MaskedView>
	);
}
