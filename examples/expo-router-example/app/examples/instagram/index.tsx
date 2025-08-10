import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { Footer } from "@/components/footer";

export const INSTAGRAM_IMAGES = [
	{ id: 1015, url: "https://picsum.photos/id/1015/600/900" },
	{ id: 1025, url: "https://picsum.photos/id/1025/600/900" },
	{ id: 1035, url: "https://picsum.photos/id/1035/600/900" },
	{ id: 1045, url: "https://picsum.photos/id/1045/600/900" },
	{ id: 1055, url: "https://picsum.photos/id/1055/600/900" },
	{ id: 1065, url: "https://picsum.photos/id/1065/600/900" },
	{ id: 1075, url: "https://picsum.photos/id/1075/600/900" },
	{ id: 1085, url: "https://picsum.photos/id/1085/600/900" },
	{ id: 1095, url: "https://picsum.photos/id/1095/600/900" },
];

const PLACEHOLDER_COLOR = "#f1f5f9";

export default function Instagram() {
	const { top } = useSafeAreaInsets();

	const NUM_COLUMNS = 3;
	const GAP = 1;
	const { width } = Dimensions.get("window");
	const ITEM_WIDTH = (width - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

	// Calculate aspect ratio based on detail view's fixed height
	const DETAIL_HEIGHT = 490;
	const DETAIL_WIDTH = width; // Full screen width
	const ASPECT_RATIO = DETAIL_WIDTH / DETAIL_HEIGHT; // This will match the detail view
	// Or simply use the actual image aspect ratio:
	// const ASPECT_RATIO = 600 / 900; // 2:3 ratio from the actual images

	return (
		<>
			<ScrollView style={{ flex: 1, opacity: 1, backgroundColor: "white" }}>
				<View style={{ paddingTop: top + 11, paddingHorizontal: 16 }}>
					<Text style={{ fontSize: 24, fontWeight: "bold", color: "black" }}>
						trpfsu
					</Text>
				</View>
				{/* Header */}
				<View
					style={{
						flexDirection: "row",
						marginTop: 37,
						gap: 21,
						paddingHorizontal: 16,
					}}
				>
					<View
						style={{
							width: 86,
							borderRadius: 75,
							height: 86,
							backgroundColor: PLACEHOLDER_COLOR,
						}}
					>
						<View
							style={[
								StyleSheet.absoluteFillObject,
								{
									alignItems: "flex-end",
									justifyContent: "flex-end",
									transform: [{ translateX: 8 }, { translateY: 8 }],
								},
							]}
						>
							<View
								style={{
									width: 20,
									height: 20,
									borderRadius: 999,
									backgroundColor: "white",
									margin: 4,
									alignItems: "center",
									justifyContent: "center",
									padding: 15,
								}}
							>
								<View
									style={{
										width: 20,
										height: 20,
										borderRadius: 999,
										backgroundColor: "black",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<FontAwesome6 name="plus" size={12} color="white" />
								</View>
							</View>
						</View>
					</View>

					<View style={{ flex: 1, gap: 10 }}>
						<View>
							<Text style={{ color: "black", fontSize: 14, fontWeight: "500" }}>
								ed
							</Text>
						</View>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: 36,
							}}
						>
							<View>
								<Text
									style={{ color: "black", fontSize: 16, fontWeight: "500" }}
								>
									2
								</Text>
								<Text
									style={{ color: "black", fontSize: 14, fontWeight: "500" }}
								>
									posts
								</Text>
							</View>
							<View>
								<Text
									style={{ color: "black", fontSize: 16, fontWeight: "500" }}
								>
									67
								</Text>
								<Text
									style={{ color: "black", fontSize: 14, fontWeight: "500" }}
								>
									followers
								</Text>
							</View>
							<View>
								<Text
									style={{ color: "black", fontSize: 16, fontWeight: "500" }}
								>
									61
								</Text>
								<Text
									style={{ color: "black", fontSize: 14, fontWeight: "500" }}
								>
									following
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Actions */}
				<View
					style={{
						flexDirection: "row",
						gap: 6,
						paddingHorizontal: 16,
						marginTop: 21,
					}}
				>
					<View
						style={{
							backgroundColor: PLACEHOLDER_COLOR,
							borderRadius: 10,
							padding: 9,
							alignItems: "center",
							justifyContent: "center",
							flex: 1,
						}}
					>
						<Text style={{ color: "black", fontSize: 14, fontWeight: "500" }}>
							Edit profile
						</Text>
					</View>
					<View
						style={{
							backgroundColor: PLACEHOLDER_COLOR,
							borderRadius: 10,
							padding: 9,
							alignItems: "center",
							justifyContent: "center",
							flex: 1,
						}}
					>
						<Text style={{ color: "black", fontSize: 14, fontWeight: "500" }}>
							Edit profile
						</Text>
					</View>
					<View
						style={{
							backgroundColor: PLACEHOLDER_COLOR,
							borderRadius: 10,
							padding: 9,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<FontAwesome6 name="user-plus" size={11} color="black" />
					</View>
				</View>

				{/* Posts */}
				<View style={{ marginTop: 19 }}>
					<View
						style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}
					>
						<View
							style={{
								width: 60,
								height: 60,
								backgroundColor: "white",
								borderRadius: 999,
								borderWidth: 2,
								borderColor: PLACEHOLDER_COLOR,
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<FontAwesome6 name="plus" size={25} color="black" />
						</View>
					</View>
				</View>
				<View
					style={{
						flexDirection: "row",
						gap: 12,

						marginTop: 44,
					}}
				>
					<View style={{ alignItems: "center", flex: 1 }}>
						<MaterialCommunityIcons
							name="grid"
							size={28}
							color="black"
							style={{ marginRight: 4, marginBottom: 2 }}
						/>
					</View>
					<View style={{ alignItems: "center", flex: 1 }}>
						<MaterialCommunityIcons
							name="tag"
							size={28}
							color="black"
							style={{ marginRight: 4, marginBottom: 2 }}
						/>
					</View>
				</View>
				<View
					style={{
						height: 1,
						backgroundColor: PLACEHOLDER_COLOR,
						marginTop: 8,
					}}
				/>
				<View>
					<View style={{ flexDirection: "row", flexWrap: "wrap" }}>
						{INSTAGRAM_IMAGES.map((image, index) => {
							const isLastInRow = (index + 1) % NUM_COLUMNS === 0;
							return (
								<Transition.Pressable
									key={`${image.id.toString()}`}
									style={{
										width: ITEM_WIDTH,
										aspectRatio: ASPECT_RATIO, // Use calculated aspect ratio
										marginRight: isLastInRow ? 0 : GAP,
										marginBottom: GAP,
										backgroundColor: PLACEHOLDER_COLOR,
									}}
									onPress={() => {
										router.push({
											pathname: "/examples/instagram/[id]",
											params: {
												id: image.id.toString(),
												sharedBoundId: `instagram-${image.id}`,
											},
										});
									}}
									sharedBoundTag={`instagram-${image.id}`}
								>
									<Image
										key={`${image.id.toString()}`}
										source={{ uri: image.url }}
										style={{
											width: ITEM_WIDTH,
											aspectRatio: ASPECT_RATIO, // Use same aspect ratio
											marginRight: isLastInRow ? 0 : GAP,
											backgroundColor: PLACEHOLDER_COLOR,
										}}
									/>
								</Transition.Pressable>
							);
						})}
					</View>
				</View>
			</ScrollView>
			<Footer backIcon="chevron-left" />
		</>
	);
}
