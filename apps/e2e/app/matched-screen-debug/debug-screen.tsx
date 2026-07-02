import { router } from "expo-router";
import { VideoView } from "expo-video";
import { useCallback, useMemo, useState } from "react";
import {
	Pressable,
	type StyleProp,
	StyleSheet,
	Text,
	View,
	type ViewStyle,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { debugVideoPlayer } from "./debug-video-player";

const BOUNDARY_ID = "video-nested";
const FRAME_HEIGHT = 126;
const FRAME_WIDTH = 168;
const RANDOM_X_RANGE = 84;
const RANDOM_Y_RANGE = 160;
const SMALL_SCALE = 0.58;
const LARGE_SCALE = 1.48;
const SHOW_DEBUG_FRAME_BORDERS = false;
const SPRING_CONFIG = {
	damping: 26,
	stiffness: 220,
};

type RouteLetter = "a" | "b" | "c" | "d" | "e";

type DebugScreenProps = {
	backgroundColor: string;
	letter: RouteLetter;
	next?: RouteLetter;
	placementStyle: StyleProp<ViewStyle>;
	showVideo?: boolean;
};

export function DebugScreen({
	backgroundColor,
	letter,
	next,
	placementStyle,
	showVideo = false,
}: DebugScreenProps) {
	const canGoBack = letter !== "a";
	const randomOffsetX = useSharedValue(0);
	const randomOffsetY = useSharedValue(0);
	const randomScale = useSharedValue(1);
	const [debugState, setDebugState] = useState({
		scale: 1,
		x: 0,
		y: 0,
	});

	const randomizedPlacementStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: randomOffsetX.value },
			{ translateY: randomOffsetY.value },
		],
	}));

	const randomizedBoundaryStyle = useMemo(
		() =>
			({
				transform: [{ scale: randomScale }],
			}) as any,
		[randomScale],
	);

	const moveBoundary = useCallback(
		(scale: number) => {
			const nextX = (Math.random() * 2 - 1) * RANDOM_X_RANGE;
			const nextY = (Math.random() * 2 - 1) * RANDOM_Y_RANGE;

			setDebugState({ scale, x: nextX, y: nextY });
			randomOffsetX.value = withSpring(nextX, SPRING_CONFIG);
			randomOffsetY.value = withSpring(nextY, SPRING_CONFIG);
			randomScale.value = withSpring(scale, SPRING_CONFIG);
		},
		[randomOffsetX, randomOffsetY, randomScale],
	);

	return (
		<View
			testID={`matched-screen-debug-${letter}`}
			style={[styles.screen, { backgroundColor }]}
		>
			<View style={[styles.placement, placementStyle]}>
				<Animated.View style={[styles.motionFrame, randomizedPlacementStyle]}>
					{SHOW_DEBUG_FRAME_BORDERS ? (
						<View pointerEvents="none" style={styles.layoutGuide}>
							<Text style={styles.layoutGuideLabel}>layout</Text>
						</View>
					) : null}
					<Transition.Boundary
						id={BOUNDARY_ID}
						testID={`matched-screen-debug-${letter}-boundary`}
						portal={showVideo ? "boundary-local" : false}
						style={[
							styles.frame,
							styles.boundaryFrame,
							SHOW_DEBUG_FRAME_BORDERS ? styles.boundaryDebugBorder : undefined,
							randomizedBoundaryStyle,
						]}
					>
						{showVideo ? (
							<Transition.Boundary.Target
								style={styles.payload}
								pointerEvents="none"
							>
								<VideoView
									player={debugVideoPlayer}
									style={StyleSheet.absoluteFill}
									contentFit="cover"
									nativeControls={false}
									pointerEvents="none"
								/>
							</Transition.Boundary.Target>
						) : null}
					</Transition.Boundary>
				</Animated.View>
			</View>
			<View pointerEvents="none" style={styles.badge}>
				<Text style={styles.badgeTitle}>Screen {letter.toUpperCase()}</Text>
				<Text style={styles.badgeText}>
					x {Math.round(debugState.x)} y {Math.round(debugState.y)} scale{" "}
					{debugState.scale.toFixed(2)}
				</Text>
			</View>
			<View style={styles.actions}>
				<Pressable
					testID={`matched-screen-debug-${letter}-small`}
					style={({ pressed }) => [
						styles.button,
						styles.randomizeButton,
						pressed ? styles.buttonPressed : undefined,
					]}
					onPress={() => moveBoundary(SMALL_SCALE)}
				>
					<Text style={styles.buttonText}>Small</Text>
				</Pressable>
				<Pressable
					testID={`matched-screen-debug-${letter}-large`}
					style={({ pressed }) => [
						styles.button,
						styles.randomizeButton,
						pressed ? styles.buttonPressed : undefined,
					]}
					onPress={() => moveBoundary(LARGE_SCALE)}
				>
					<Text style={styles.buttonText}>Large</Text>
				</Pressable>
				{canGoBack ? (
					<Pressable
						testID={`matched-screen-debug-${letter}-back`}
						style={({ pressed }) => [
							styles.button,
							pressed ? styles.buttonPressed : undefined,
						]}
						onPress={() => router.back()}
					>
						<Text style={styles.buttonText}>Back</Text>
					</Pressable>
				) : null}
				{next ? (
					<Pressable
						testID={`matched-screen-debug-${letter}-next`}
						style={({ pressed }) => [
							styles.button,
							pressed ? styles.buttonPressed : undefined,
						]}
						onPress={() => router.push(`/matched-screen-debug/${next}`)}
					>
						<Text style={styles.buttonText}>Next</Text>
					</Pressable>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	actions: {
		alignItems: "center",
		bottom: 60,
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		justifyContent: "center",
		left: 16,
		position: "absolute",
		right: 16,
	},
	badge: {
		backgroundColor: "rgba(0, 0, 0, 0.64)",
		borderRadius: 8,
		left: 16,
		paddingHorizontal: 12,
		paddingVertical: 10,
		position: "absolute",
		top: 64,
	},
	badgeText: {
		color: "white",
		fontFamily: "monospace",
		fontSize: 12,
		marginTop: 4,
	},
	badgeTitle: {
		color: "white",
		fontSize: 14,
		fontWeight: "800",
		letterSpacing: 0,
		textTransform: "uppercase",
	},
	boundaryFrame: {
		backgroundColor: "rgba(123, 111, 208, 0.18)",
	},
	boundaryDebugBorder: {
		borderColor: "#7B6FD0",
		borderRadius: 18,
		borderWidth: 4,
	},
	button: {
		backgroundColor: "white",
		borderRadius: 10,
		minWidth: 96,
		paddingHorizontal: 18,
		paddingVertical: 14,
	},
	buttonPressed: {
		opacity: 0.58,
	},
	buttonText: {
		color: "black",
		fontSize: 17,
		fontWeight: "700",
		textAlign: "center",
	},
	frame: {
		height: FRAME_HEIGHT,
		overflow: "hidden",
		width: FRAME_WIDTH,
	},
	layoutGuide: {
		alignItems: "center",
		borderColor: "#FF453A",
		borderStyle: "dashed",
		borderWidth: 2,
		height: FRAME_HEIGHT,
		justifyContent: "flex-start",
		position: "absolute",
		width: FRAME_WIDTH,
	},
	layoutGuideLabel: {
		backgroundColor: "white",
		color: "#FF453A",
		fontSize: 11,
		fontWeight: "800",
		paddingHorizontal: 6,
		paddingVertical: 3,
		textTransform: "uppercase",
	},
	motionFrame: {
		height: FRAME_HEIGHT,
		position: "absolute",
		width: FRAME_WIDTH,
	},
	placement: {
		height: FRAME_HEIGHT,
		position: "absolute",
		width: FRAME_WIDTH,
	},
	payload: {
		height: FRAME_HEIGHT,
		width: FRAME_WIDTH,
	},
	randomizeButton: {
		minWidth: 92,
	},
	screen: {
		flex: 1,
	},
});
