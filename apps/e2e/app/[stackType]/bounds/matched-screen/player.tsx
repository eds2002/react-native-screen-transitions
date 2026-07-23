import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import {
	MATCHED_SCREEN_ASPECT_RATIO,
	MATCHED_SCREEN_BOUNDARY_GROUP,
	MATCHED_SCREEN_DETAIL_WIDTH,
	MATCHED_SCREEN_VIDEOS,
} from "./constants";

export default function MatchedScreenPlayer() {
	const params = useLocalSearchParams<{ id?: string | string[] }>();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;
	const example = MATCHED_SCREEN_VIDEOS.find((video) => video.id === id);

	if (!example) {
		throw new Error(`Unknown video example: ${String(id)}`);
	}

	const receiverStyle = {
		width: MATCHED_SCREEN_DETAIL_WIDTH,
		height: MATCHED_SCREEN_DETAIL_WIDTH / MATCHED_SCREEN_ASPECT_RATIO,
		borderRadius: 34,
	};

	return (
		<View
			accessibilityLabel="Close video"
			accessibilityRole="button"
			style={styles.detail}
			testID="matched-screen-close"
		>
			<StatusBar style="dark" />
			<View style={styles.detailContent}>
				<Transition.Boundary
					group={MATCHED_SCREEN_BOUNDARY_GROUP}
					handoff
					id={example.id}
					style={[styles.detailVideo, receiverStyle]}
					testID={`matched-screen-destination-${example.id}`}
				/>
				<Text style={styles.detailCaption}>{example.title}</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	detail: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#FFFFFF",
	},
	detailVideo: {
		borderCurve: "continuous",
		overflow: "hidden",
	},
	detailContent: {
		alignItems: "center",
		gap: 10,
	},
	detailCaption: {
		color: "#69716B",
		fontSize: 13,
		fontWeight: "600",
	},
});
