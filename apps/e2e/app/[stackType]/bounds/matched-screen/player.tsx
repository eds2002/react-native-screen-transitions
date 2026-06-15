import { router } from "expo-router";
import {
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";
import { MATCHED_SCREEN_VIDEO_ID } from "./constants";

export default function MatchedScreenPlayer() {
	const theme = useTheme();
	const { width } = useWindowDimensions();
	const videoWidth = width;
	const videoHeight = videoWidth * 1.35;

	return (
		<SafeAreaView
			style={[
				styles.container,
				{
					borderRadius: 56,
					overflow: "hidden",
					borderCurve: "continuous",
				},
			]}
			// edges={["top"]}
		>
			<View style={styles.content}>
				<View
					style={[
						styles.videoSlot,
						{
							width: videoWidth,
							height: videoHeight,
						},
					]}
				>
					<Transition.Boundary.View
						id={MATCHED_SCREEN_VIDEO_ID}
						testID="matched-screen-video-destination"
						style={StyleSheet.absoluteFill}
					/>
				</View>

				<Pressable
					testID="matched-screen-video-close"
					style={[
						styles.closeButton,
						{
							borderColor: theme.separator,
						},
					]}
					onPress={() => router.back()}
				>
					<Text style={[styles.closeText, { color: theme.text }]}>Close</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 20,
		// paddingHorizontal: 12,
	},
	videoSlot: {
		overflow: "hidden",
	},
	portalHost: {
		width: "100%",
		height: "100%",
	},
	closeButton: {
		borderWidth: 1,
		paddingHorizontal: 18,
		paddingVertical: 10,
	},
	closeText: {
		fontSize: 15,
		fontWeight: "700",
	},
});
