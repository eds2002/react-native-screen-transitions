import { FontAwesome6 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { Footer } from "@/components/footer";

const PROFILE_IMAGE_SIZE = 32;
const HEADER_TOP = (top: number) => top + 6;
const CONTAINER_PADDING = 16;
const PLACEHOLDER_COLOR = "#e5e7eb";

const Header = () => {
	return (
		<View
			style={{
				paddingHorizontal: CONTAINER_PADDING,

				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "center",
			}}
		>
			<View
				style={{
					width: PROFILE_IMAGE_SIZE,
					height: PROFILE_IMAGE_SIZE,
					borderRadius: 100,
					backgroundColor: PLACEHOLDER_COLOR,
					alignSelf: "center",
				}}
			/>
			<View
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					top: 0,
					bottom: 0,
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<Text style={{ fontSize: 28, fontWeight: "bold", textAlign: "center" }}>
					X
				</Text>
			</View>
		</View>
	);
};

const Tabs = () => {
	const tabs = ["For you", "Following"];

	return (
		<View style={{ gap: 10 }}>
			<View style={{ flexDirection: "row", paddingHorizontal: 11, gap: 22 }}>
				{tabs.map((tab) => (
					<Text
						key={tab}
						style={{
							fontSize: 16,
							fontWeight: "600",
							letterSpacing: -0.85,
						}}
					>
						{tab}
					</Text>
				))}
			</View>
			<View
				style={{
					height: 3,
					backgroundColor: "#f43f5e",
					marginHorizontal: 8,
					width: 60,
					borderRadius: 100,
				}}
			/>
		</View>
	);
};

const Post = ({ imageId }: { imageId: string }) => {
	return (
		<View
			style={{
				padding: 9,
				borderBottomWidth: 1,
				borderColor: "#d3d3d325",
			}}
		>
			<View
				style={{
					flexDirection: "row",
					gap: 6,
				}}
			>
				<View
					style={{
						width: 45,
						height: 45,
						backgroundColor: PLACEHOLDER_COLOR,
						borderRadius: 100,
					}}
				/>
				<View style={{ flex: 1 }}>
					<View>
						<View
							style={{ flexDirection: "row", gap: 4, alignItems: "center" }}
						>
							<Text style={{ fontSize: 16, fontWeight: "600" }}>User</Text>
							<Text
								style={{
									fontSize: 14,
									opacity: 0.5,
								}}
							>
								@username
							</Text>
							<View
								style={{
									width: 1,
									height: 1,
									backgroundColor: "black",
									opacity: 0.5,
								}}
							/>
							<Text
								style={{
									fontSize: 14,

									opacity: 0.5,
								}}
							>
								12h
							</Text>
						</View>
					</View>
					<Transition.Pressable
						style={{
							alignSelf: "stretch",
							aspectRatio: 1,
							backgroundColor: PLACEHOLDER_COLOR,
							borderRadius: 10,
							overflow: "hidden",
						}}
						sharedBoundTag={`x-post-${imageId}`}
						onPress={() => {
							router.push({
								pathname: "/examples/x/[id]",
								params: {
									id: imageId,
									boundId: `x-post-${imageId}`,
									url: `https://picsum.photos/id/${imageId}/600/900`,
								},
							});
						}}
					>
						<Image
							source={{
								uri: `https://picsum.photos/id/${imageId}/600/900`,
							}}
							style={{ flex: 1, objectFit: "cover" }}
							contentFit="cover"
							transition={300}
							priority="high"
						/>
					</Transition.Pressable>
					<View style={{ flexDirection: "row", gap: 32, marginTop: 10 }}>
						<View style={{ flexDirection: "row", gap: 4 }}>
							<FontAwesome6 name="comment" size={16} color="gray" />
							<Text style={{ fontSize: 14, color: "gray" }}> 0 </Text>
						</View>
						<View style={{ flexDirection: "row", gap: 4 }}>
							<FontAwesome6 name="retweet" size={16} color="gray" />
							<Text style={{ fontSize: 14, color: "gray" }}> 0 </Text>
						</View>
						<View style={{ flexDirection: "row", gap: 4 }}>
							<FontAwesome6 name="heart" size={16} color="gray" />
							<Text style={{ fontSize: 14, color: "gray" }}> 0 </Text>
						</View>
					</View>
				</View>
			</View>
		</View>
	);
};

export default function X() {
	const { top } = useSafeAreaInsets();

	const postsid = ["28", "29", "74", "87", "120", "121"];
	return (
		<>
			<ScrollView
				style={{
					paddingTop: HEADER_TOP(top),
					backgroundColor: "white",
				}}
			>
				<View style={{ gap: 18 }}>
					<Header />
					<Tabs />
				</View>
				{postsid.map((id) => (
					<Post key={id} imageId={id} />
				))}
			</ScrollView>
			<Footer backIcon="chevron-left" />
		</>
	);
}
