import { FontAwesome6 } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { INSTAGRAM_IMAGES } from ".";

const PLACEHOLDER_COLOR = "#f1f5f9";

export default function InstagramId() {
	const { top } = useSafeAreaInsets();
	const { id, sharedBoundId } = useLocalSearchParams<{
		id: string;
		sharedBoundId: string;
	}>();

	const image = INSTAGRAM_IMAGES.find((image) => image.id === Number(id));

	return (
		<MaskedView
			style={{ flex: 1 }}
			maskElement={
				<Transition.View
					styleId={"masked-view"}
					style={{ backgroundColor: "white" }}
				/>
			}
		>
			<Transition.View
				styleId={"container-view"}
				style={{ flex: 1, backgroundColor: "white" }}
			>
				<View
					style={{
						paddingHorizontal: 12,
						paddingTop: top + 10,
						flexDirection: "row",
						alignItems: "center",

						justifyContent: "space-between",
					}}
				>
					<Pressable onPress={() => router.back()}>
						<FontAwesome6 name="chevron-left" size={20} color="black" />
					</Pressable>
					<View
						style={{
							alignItems: "center",
							justifyContent: "center",
							left: 0,
							right: 0,
							paddingTop: top + 10,
							position: "absolute",
							alignSelf: "center",
						}}
					>
						<Text
							style={{
								fontSize: 15,
								fontWeight: "600",
								color: "black",
								textAlign: "center",
							}}
						>
							Posts
						</Text>
						<Text
							style={{
								fontSize: 12,
								fontWeight: "600",
								color: "black",
								textAlign: "center",
								opacity: 0.5,
							}}
						>
							trpfsu
						</Text>
					</View>
				</View>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						paddingHorizontal: 12,
						paddingVertical: 12,
						marginTop: 12,
					}}
				>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
						<View
							style={{
								width: 30,
								height: 30,
								borderRadius: 999,
								backgroundColor: PLACEHOLDER_COLOR,
							}}
						/>
						<Text style={{ fontSize: 14, fontWeight: "600", color: "black" }}>
							trpfsu
						</Text>
					</View>
				</View>
				<Transition.View
					style={{
						backgroundColor: PLACEHOLDER_COLOR,

						alignSelf: "center",
						width: "100%",
						height: 490,
						overflow: "hidden",
					}}
					sharedBoundTag={sharedBoundId}
				>
					<Image
						source={{ uri: image?.url }}
						style={{ width: "100%", height: "100%" }}
					/>
				</Transition.View>
			</Transition.View>
		</MaskedView>
	);
}
