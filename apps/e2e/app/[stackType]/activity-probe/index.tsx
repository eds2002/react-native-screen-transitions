import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	Easing,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useActivityProbeStore } from "@/components/activity-probe/store";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

const HEARTBEAT_INTERVAL_MS = 120;

const formatAge = (ageMs: number | null) =>
	ageMs === null ? "waiting" : `${Math.round(ageMs)}ms ago`;

export default function ActivityProbeIndexScreen() {
	const stackType = useResolvedStackType();
	const theme = useTheme();
	const heartbeatCount = useActivityProbeStore((state) => state.heartbeatCount);
	const pressCount = useActivityProbeStore((state) => state.pressCount);
	const lastHeartbeatAt = useActivityProbeStore(
		(state) => state.lastHeartbeatAt,
	);
	const recordHeartbeat = useActivityProbeStore(
		(state) => state.recordHeartbeat,
	);
	const recordPress = useActivityProbeStore((state) => state.recordPress);
	const reset = useActivityProbeStore((state) => state.reset);
	const pulse = useSharedValue(0);

	useEffect(() => {
		reset();
	}, [reset]);

	useEffect(() => {
		const timer = setInterval(() => {
			recordHeartbeat();
		}, HEARTBEAT_INTERVAL_MS);

		return () => clearInterval(timer);
	}, [recordHeartbeat]);

	useEffect(() => {
		pulse.value = withRepeat(
			withTiming(1, {
				duration: 900,
				easing: Easing.inOut(Easing.quad),
			}),
			-1,
			true,
		);
	}, [pulse]);

	const pulseStyle = useAnimatedStyle(() => {
		const scale = interpolate(pulse.value, [0, 1], [1, 1.08]);
		const opacity = interpolate(pulse.value, [0, 1], [0.5, 1]);

		return {
			transform: [{ scale }],
			opacity,
		};
	});

	const heartbeatAge =
		lastHeartbeatAt === null ? null : performance.now() - lastHeartbeatAt;

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Activity Probe"
				subtitle={
					stackType === "blank-stack"
						? "Open the inert sheet first. From there, open the pause layer to push this screen past the last-two keep-alive window."
						: "Control stack for comparison against blank-stack activity behavior."
				}
			/>

			<View style={styles.content}>
				<View style={[styles.metricCard, { backgroundColor: theme.card }]}>
					<Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
						JS heartbeat
					</Text>
					<Text
						testID="activity-probe-heartbeat-count"
						style={[styles.metricValue, { color: theme.text }]}
					>
						{heartbeatCount}
					</Text>
					<Text style={[styles.metricDetail, { color: theme.textTertiary }]}>
						Last tick {formatAge(heartbeatAge)}
					</Text>
				</View>

				<View style={[styles.metricCard, { backgroundColor: theme.card }]}>
					<Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
						Background presses
					</Text>
					<Text
						testID="activity-probe-press-count"
						style={[styles.metricValue, { color: theme.text }]}
					>
						{pressCount}
					</Text>
					<Text style={[styles.metricDetail, { color: theme.textTertiary }]}>
						This should stop changing while the inert sheet blocks touches.
					</Text>
				</View>

				<Pressable
					testID="activity-probe-press-surface"
					style={[
						styles.pressSurface,
						{ backgroundColor: theme.surfaceElevated },
					]}
					onPress={recordPress}
				>
					<Animated.View
						style={[
							styles.pulse,
							{ backgroundColor: theme.actionButton },
							pulseStyle,
						]}
					/>
					<Text style={[styles.surfaceTitle, { color: theme.text }]}>
						React + Reanimated workbench
					</Text>
					<Text style={[styles.surfaceText, { color: theme.textSecondary }]}>
						Tap this panel to increment presses. The heartbeat above is a JS
						interval. The glowing dot is a Reanimated loop.
					</Text>
				</Pressable>

				<View style={styles.buttonColumn}>
					<Pressable
						testID="activity-probe-open-inert"
						style={({ pressed }) => [
							styles.button,
							{
								backgroundColor: pressed
									? theme.actionButtonPressed
									: theme.actionButton,
							},
						]}
						onPress={() =>
							router.push(
								buildStackPath(stackType, "activity-probe/inert-sheet"),
							)
						}
					>
						<Text
							style={[styles.buttonText, { color: theme.actionButtonText }]}
						>
							Open inert sheet
						</Text>
					</Pressable>

					<Pressable
						style={({ pressed }) => [
							styles.resetButton,
							{
								borderColor: theme.separator,
								backgroundColor: pressed ? theme.card : "transparent",
							},
						]}
						onPress={reset}
					>
						<Text style={[styles.resetText, { color: theme.text }]}>
							Reset probe
						</Text>
					</Pressable>
				</View>

				<View style={[styles.noteCard, { backgroundColor: theme.card }]}>
					<Text style={[styles.noteTitle, { color: theme.text }]}>
						What to look for
					</Text>
					<Text style={[styles.noteText, { color: theme.textSecondary }]}>
						1. Open the inert sheet. The heartbeat should keep climbing because
						the screen stays mounted. Background taps should stop.
					</Text>
					<Text style={[styles.noteText, { color: theme.textSecondary }]}>
						2. From the inert sheet, open the pause layer. That makes this
						probe screen deeper than `routes.length - 2`, so its heartbeat
						should stall after the push settles.
					</Text>
				</View>
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
		paddingHorizontal: 20,
		paddingBottom: 24,
		gap: 16,
	},
	metricCard: {
		borderRadius: 12,
		padding: 16,
	},
	metricLabel: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
	},
	metricValue: {
		fontSize: 40,
		fontWeight: "800",
	},
	metricDetail: {
		fontSize: 13,
		marginTop: 6,
	},
	pressSurface: {
		borderRadius: 16,
		padding: 20,
		minHeight: 180,
		justifyContent: "center",
		alignItems: "center",
	},
	pulse: {
		width: 28,
		height: 28,
		borderRadius: 14,
		marginBottom: 18,
	},
	surfaceTitle: {
		fontSize: 20,
		fontWeight: "700",
		marginBottom: 10,
		textAlign: "center",
	},
	surfaceText: {
		fontSize: 14,
		lineHeight: 20,
		textAlign: "center",
		maxWidth: 320,
	},
	buttonColumn: {
		gap: 12,
	},
	button: {
		borderRadius: 14,
		paddingVertical: 16,
		paddingHorizontal: 18,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "700",
	},
	resetButton: {
		borderRadius: 14,
		borderWidth: 1,
		paddingVertical: 14,
		alignItems: "center",
	},
	resetText: {
		fontSize: 15,
		fontWeight: "600",
	},
	noteCard: {
		borderRadius: 12,
		padding: 16,
	},
	noteTitle: {
		fontSize: 14,
		fontWeight: "700",
		marginBottom: 8,
	},
	noteText: {
		fontSize: 13,
		lineHeight: 19,
		marginBottom: 6,
	},
});
