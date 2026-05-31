import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { getXPostImageUrl } from "./constants";

const FALLBACK_BOUND_TAG = "shared-x-image-fallback";

const getSingleParam = (value: string | string[] | undefined) =>
	Array.isArray(value) ? value[0] : value;

export default function SharedXImageDetail() {
	const params = useLocalSearchParams<{
		id?: string | string[];
		boundId?: string | string[];
		url?: string | string[];
	}>();
	const postId = getSingleParam(params.id) ?? "28";
	const boundId = getSingleParam(params.boundId) ?? FALLBACK_BOUND_TAG;
	const imageUrl = getSingleParam(params.url) ?? getXPostImageUrl(postId);

	return (
		<View style={styles.container}>
			<Transition.View sharedBoundTag={boundId} style={styles.imageFrame}>
				<Image source={imageUrl} style={styles.image} contentFit="cover" />
			</Transition.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	imageFrame: {
		width: "100%",
		aspectRatio: 1,
		overflow: "hidden",
	},
	image: {
		width: "100%",
		height: "100%",
	},
});
