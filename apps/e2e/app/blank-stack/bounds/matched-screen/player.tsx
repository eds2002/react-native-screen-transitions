import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import {
	CARRIED_HANDOFF_ID,
	CARRIED_IMAGE_ASPECT_RATIO,
	CARRIED_IMAGE_SOURCE,
	MATCHED_SCREEN_ASPECT_RATIO,
	MATCHED_SCREEN_DETAIL_WIDTH,
	MATCHED_SCREEN_VIDEOS,
	type MatchedScreenPayloadMode,
} from "./constants";

export default function MatchedScreenPlayer() {
	const params = useLocalSearchParams<{
		handoffMode?: string | string[];
		id?: string | string[];
		payloadMode?: string | string[];
	}>();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;
	const handoffMode = Array.isArray(params.handoffMode)
		? params.handoffMode[0]
		: params.handoffMode;
	const example = MATCHED_SCREEN_VIDEOS.find((video) => video.id === id);
	const isCarriedImage = id === CARRIED_HANDOFF_ID;
	const payloadMode = (
		Array.isArray(params.payloadMode)
			? params.payloadMode[0]
			: params.payloadMode
	) as MatchedScreenPayloadMode | undefined;

	if (!(id && (example || isCarriedImage))) {
		throw new Error(`Unknown video example: ${String(id)}`);
	}

	const receiverStyle = isCarriedImage
		? {
				width: 300,
				height: 300 / CARRIED_IMAGE_ASPECT_RATIO,
				borderRadius: 0,
			}
		: {
				width: MATCHED_SCREEN_DETAIL_WIDTH,
				height: MATCHED_SCREEN_DETAIL_WIDTH / MATCHED_SCREEN_ASPECT_RATIO,
				borderRadius: 34,
			};

	return (
		<Pressable
			accessibilityLabel="Close video"
			accessibilityRole="button"
			onPress={() => router.back()}
			style={styles.detail}
			testID="matched-screen-close"
		>
			<StatusBar style="dark" />
			<View style={styles.detailContent}>
				<Transition.Boundary
					handoff
					id={id}
					style={[styles.detailVideo, receiverStyle]}
					testID={`matched-screen-destination-${id}`}
				>
					{isCarriedImage && payloadMode === "duplicate" ? (
						<Image
							contentFit="cover"
							enforceEarlyResizing
							placeholder={CARRIED_IMAGE_SOURCE}
							placeholderContentFit="cover"
							recyclingKey="matched-screen-carried-full-size"
							source={CARRIED_IMAGE_SOURCE}
							style={styles.image}
						/>
					) : null}
				</Transition.Boundary>
				<Text style={styles.detailCaption}>
					{isCarriedImage ? "Carried image" : example?.title}
				</Text>
				<Text style={styles.handoffMode} testID="matched-screen-player-mode">
					{isCarriedImage
						? `${payloadMode === "duplicate" ? "Two" : "One"} payload handoff`
						: handoffMode === "explicit"
							? "Explicit handoff target"
							: "Automatic handoff"}
				</Text>
			</View>
		</Pressable>
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
	handoffMode: {
		color: "#98A09A",
		fontSize: 11,
		fontWeight: "600",
		textTransform: "uppercase",
	},
	image: {
		height: "100%",
		width: "100%",
	},
});
