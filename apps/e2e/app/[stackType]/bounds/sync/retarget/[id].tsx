import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
	Button,
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

const BOX_SIZE = 200;
const HEADER_ESTIMATE = 120;
const FOOTER_ESTIMATE = 120;
const SCALE_MIN = 0.45;
const SCALE_MAX = 1.65;
const SHOW_DEBUG_FRAME_BORDERS = false;

export default function SyncRetargetDetail() {
	const insets = useSafeAreaInsets();
	const theme = useTheme();
	const { width: screenWidth, height: screenHeight } = useWindowDimensions();
	const [debugState, setDebugState] = useState({
		scale: 1,
		x: 0,
		y: 0,
	});

	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);
	const scale = useSharedValue(1);

	const shuffle = () => {
		const arenaTop = insets.top + HEADER_ESTIMATE;
		const arenaBottom = screenHeight - FOOTER_ESTIMATE;
		const arenaHeight = arenaBottom - arenaTop;

		const newScale = SCALE_MIN + Math.random() * (SCALE_MAX - SCALE_MIN);
		const scaledSize = BOX_SIZE * newScale;

		const maxX = Math.max(0, screenWidth - scaledSize);
		const maxY = Math.max(0, arenaHeight - scaledSize);
		const nextX = Math.random() * maxX;
		const nextY = Math.random() * maxY;

		setDebugState({
			scale: newScale,
			x: nextX,
			y: nextY,
		});
		translateX.value = withSpring(nextX);
		translateY.value = withSpring(nextY);
		scale.value = withSpring(newScale);
	};

	const animatedWrapperStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: translateX.value },
			{ translateY: translateY.value },
		],
	}));

	const boundaryScaleStyle = useMemo(
		() =>
			({
				transform: [{ scale }],
			}) as any,
		[scale],
	);

	return (
		<View
			style={[
				styles.container,
				{
					paddingTop: insets.top,
				},
			]}
		>
			<ScreenHeader
				title={"Retarget"}
				subtitle="Dedicated sync retarget destination"
			/>

			<Animated.View style={styles.arena}>
				<Animated.View style={[styles.positionWrapper, animatedWrapperStyle]}>
					{SHOW_DEBUG_FRAME_BORDERS ? (
						<View pointerEvents="none" style={styles.layoutGuide}>
							<Text style={styles.layoutGuideLabel}>layout frame</Text>
						</View>
					) : null}
					<Transition.Boundary.View
						id="retarget"
						anchor="center"
						scaleMode="match"
						style={[
							styles.boundaryBox,
							boundaryScaleStyle,
							{
								width: BOX_SIZE,
								height: BOX_SIZE,
							},
						]}
					>
						<Animated.View
							style={[
								styles.activeBox,
								SHOW_DEBUG_FRAME_BORDERS
									? styles.activeBoxDebugBorder
									: undefined,
								{
									backgroundColor: "#7B6FD0" + "25",
								},
							]}
						>
							<Text style={[styles.activeLabel, { color: theme.text }]}>
								DST1
							</Text>
						</Animated.View>
					</Transition.Boundary.View>
				</Animated.View>
			</Animated.View>

			<View style={styles.footer}>
				<Button
					testID="sync-retarget-toggle"
					title="Shuffle"
					onPress={shuffle}
				/>
				<Pressable
					testID="sync-retarget-back"
					onPress={() => router.back()}
					style={[styles.backButton, { backgroundColor: theme.actionButton }]}
				>
					<Text
						style={[styles.backButtonText, { color: theme.actionButtonText }]}
					>
						Dismiss
					</Text>
				</Pressable>
				<Text style={[styles.footerNote, { color: theme.textTertiary }]}>
					Close should return from whichever destination slot is currently
					active.
				</Text>
				<Text style={[styles.footerNote, { color: theme.textTertiary }]}>
					x {Math.round(debugState.x)} · y {Math.round(debugState.y)} · scale{" "}
					{debugState.scale.toFixed(2)}
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	toggleWrap: {
		paddingHorizontal: 24,
		paddingBottom: 12,
		alignItems: "center",
	},
	toggleNote: {
		maxWidth: 360,
		fontSize: 13,
		lineHeight: 20,
		textAlign: "center",
	},
	arena: {
		flex: 1,
		position: "relative",
	},
	positionWrapper: {
		position: "absolute",
	},
	boundaryBox: {
		alignItems: "center",
		justifyContent: "center",
		overflow: "visible",
	},
	activeBox: {
		width: "100%",
		height: "100%",
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	activeBoxDebugBorder: {
		borderColor: "#7B6FD0",
		borderWidth: 4,
	},
	layoutGuide: {
		alignItems: "center",
		borderColor: "#FF453A",
		borderStyle: "dashed",
		borderWidth: 2,
		height: BOX_SIZE,
		justifyContent: "flex-start",
		position: "absolute",
		width: BOX_SIZE,
	},
	layoutGuideLabel: {
		backgroundColor: "white",
		color: "#FF453A",
		fontSize: 11,
		fontWeight: "700",
		paddingHorizontal: 6,
		paddingVertical: 3,
	},
	activeLabel: {
		fontWeight: "700",
		fontSize: 14,
	},
	footer: {
		paddingHorizontal: 24,
		paddingBottom: 40,
		alignItems: "center",
		gap: 8,
	},
	backButton: {
		paddingHorizontal: 28,
		paddingVertical: 14,
		borderRadius: 999,
	},
	backButtonText: {
		fontWeight: "600",
		fontSize: 16,
	},
	footerNote: {
		maxWidth: 360,
		fontSize: 11,
		fontFamily: "monospace",
		textAlign: "center",
	},
});
