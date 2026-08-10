import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, Text, View } from "react-native";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

const HANDOFF_BOUNDARY_ID = "nested-handoff-video";
const HANDOFF_ASPECT_RATIO = 16 / 9;
const HANDOFF_SOURCE_WIDTH = 260;
const HANDOFF_DESTINATION_WIDTH = 328;
const HANDOFF_VIDEO_SOURCE =
	"https://res.cloudinary.com/demo/video/upload/q_auto/cld-sample-video.mp4";

export const nestedBoundaryZoomInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, focused }) => {
		"worklet";
		if (!focused) return null;

		return bounds({ id: HANDOFF_BOUNDARY_ID }).navigation.zoom({
			keepFocusedVisible: true,
			target: "bound",
		});
	};

export function NestedBoundarySource({
	destination,
	title,
}: {
	destination: string;
	title: string;
}) {
	const stackType = useResolvedStackType();
	const theme = useTheme();
	const player = useVideoPlayer(HANDOFF_VIDEO_SOURCE, (videoPlayer) => {
		videoPlayer.loop = true;
		videoPlayer.muted = true;
		videoPlayer.play();
	});

	const openDestination = () => {
		router.push(buildStackPath(stackType, destination) as never);
	};

	return (
		<View style={[styles.screen, { backgroundColor: theme.bg }]}>
			<ScreenHeader
				title={title}
				subtitle="Live content handed through nested portal hosts"
			/>
			<View style={styles.sourceContent}>
				<Transition.Boundary
					accessibilityLabel="Open handoff destination"
					accessibilityRole="button"
					escapeClipping
					handoff
					id={HANDOFF_BOUNDARY_ID}
					onPress={openDestination}
					style={styles.sourceBoundary}
					testID="nested-boundary-source"
				>
					<Transition.Boundary.Target
						pointerEvents="none"
						style={[styles.videoSurface, styles.sourceBoundary]}
					>
						<VideoView
							allowsVideoFrameAnalysis={false}
							contentFit="contain"
							nativeControls={true}
							player={player}
							pointerEvents="none"
							style={StyleSheet.absoluteFill}
							surfaceType="surfaceView"
						/>
					</Transition.Boundary.Target>
				</Transition.Boundary>
				<Text style={[styles.caption, { color: theme.textSecondary }]}>
					Experimental handoff portal · tap the video
				</Text>
			</View>
		</View>
	);
}

export function NestedBoundaryDestination({ title }: { title: string }) {
	const theme = useTheme();

	return (
		<View style={[styles.screen, { backgroundColor: theme.bg }]}>
			<ScreenHeader
				title={title}
				subtitle="The source video is rendered through this receiver"
			/>
			<View style={styles.destinationContent}>
				<Transition.Boundary
					handoff
					id={HANDOFF_BOUNDARY_ID}
					style={styles.destinationBoundary}
					testID="nested-boundary-destination"
				/>
				<Text style={[styles.caption, { color: theme.textSecondary }]}>
					Dismiss to return the same live surface to its source
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	sourceContent: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
		padding: 24,
	},
	destinationContent: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
		padding: 24,
	},
	sourceBoundary: {
		aspectRatio: HANDOFF_ASPECT_RATIO,
		borderCurve: "continuous",
		borderRadius: 28,
		width: HANDOFF_SOURCE_WIDTH,
	},
	destinationBoundary: {
		aspectRatio: HANDOFF_ASPECT_RATIO,
		backgroundColor: "#000000",
		borderCurve: "continuous",
		borderRadius: 34,
		overflow: "hidden",
		width: HANDOFF_DESTINATION_WIDTH,
	},
	videoSurface: {
		overflow: "hidden",
	},
	caption: {
		fontSize: 13,
		fontWeight: "600",
		textAlign: "center",
	},
});
