import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import Transition from "react-native-screen-transitions";

export default function XPost() {
	const { boundId, url } = useLocalSearchParams<{
		boundId: string;
		url: string;
	}>();

	return (
		<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
			<Transition.View
				style={{ aspectRatio: 1, width: "100%" }}
				sharedBoundTag={boundId}
			>
				<Image
					source={{ uri: url }}
					style={{ width: "100%", height: "100%" }}
					contentFit="cover"
				/>
			</Transition.View>
		</View>
	);
}
