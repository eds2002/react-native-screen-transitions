import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { PROFILE_IMAGE_BOUNDARY_ID, PROFILE_IMAGE_URL } from "./constants";

export default function NativeStackAdapterRecipeAvatar() {
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Transition.Boundary.View
					id={PROFILE_IMAGE_BOUNDARY_ID}
					style={styles.imageFrame}
				>
					<Image
						source={PROFILE_IMAGE_URL}
						style={styles.image}
						contentFit="cover"
					/>
				</Transition.Boundary.View>

				<Pressable
					testID="native-stack-adapter-recipe-avatar-close"
					style={({ pressed }) => [
						styles.closeButton,
						{ opacity: pressed ? 0.7 : 1 },
					]}
					onPress={router.back}
				>
					<Text style={styles.closeText}>Close</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "transparent",
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
	},
	imageFrame: {
		width: 260,
		height: 260,
		borderRadius: 130,
		overflow: "hidden",
	},
	image: {
		width: "100%",
		height: "100%",
	},
	closeButton: {
		position: "absolute",
		bottom: 48,
		borderRadius: 18,
		backgroundColor: "rgba(255,255,255,0.88)",
		paddingHorizontal: 22,
		paddingVertical: 12,
	},
	closeText: {
		color: "#111827",
		fontSize: 16,
		fontWeight: "800",
	},
});
