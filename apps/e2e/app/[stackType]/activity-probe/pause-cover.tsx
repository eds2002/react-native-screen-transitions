import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useActivityProbeStore } from "@/components/activity-probe/store";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

const STALL_THRESHOLD_MS = 750;

const formatAge = (ageMs: number | null) =>
	ageMs === null ? "waiting for the first tick" : `${Math.round(ageMs)}ms`;

export default function ActivityProbePauseCover() {
	const stackType = useResolvedStackType();
	const theme = useTheme();
	const heartbeatCount = useActivityProbeStore((state) => state.heartbeatCount);
	const lastHeartbeatAt = useActivityProbeStore(
		(state) => state.lastHeartbeatAt,
	);
	const [now, setNow] = useState(() => performance.now());

	useEffect(() => {
		const timer = setInterval(() => {
			setNow(performance.now());
		}, 200);

		return () => clearInterval(timer);
	}, []);

	const heartbeatAge = lastHeartbeatAt === null ? null : now - lastHeartbeatAt;
	const hasStalled = heartbeatAge !== null && heartbeatAge > STALL_THRESHOLD_MS;

	const status = useMemo(() => {
		if (heartbeatAge === null) {
			return {
				title: "Waiting for a reading",
				body: "The covered screen has not reported a heartbeat yet.",
			};
		}

		if (hasStalled) {
			return {
				title: "Covered screen is stalled",
				body:
					stackType === "blank-stack"
						? "This is the expected pause case. The hidden screen stopped running its JS heartbeat."
						: "The covered screen stopped updating in this stack too.",
			};
		}

		return {
			title: "Covered screen is still ticking",
			body:
				stackType === "blank-stack"
					? "During the transition this is normal. After settle, the heartbeat should stop."
					: "Use this as a control read for the native stack path.",
		};
	}, [hasStalled, heartbeatAge, stackType]);

	return (
		<SafeAreaView style={styles.container} edges={["bottom"]}>
			<View style={styles.scrim}>
				<View
					style={[styles.sheet, { backgroundColor: theme.surfaceElevated }]}
				>
					<Text style={[styles.title, { color: theme.text }]}>Pause cover</Text>
					<Text style={[styles.body, { color: theme.textSecondary }]}>
						Same transparent sheet treatment as the inert case, but when this
						opens on top of the inert sheet it pushes the probe screen past the
						last-two keep-alive window, so the covered screen should pause once
						the transition settles.
					</Text>

					<View style={styles.metricRow}>
						<View style={[styles.metric, { backgroundColor: theme.card }]}>
							<Text style={[styles.metricLabel, { color: theme.textTertiary }]}>
								Last covered heartbeat
							</Text>
							<Text
								testID="activity-probe-cover-age"
								style={[styles.metricValue, { color: theme.text }]}
							>
								{formatAge(heartbeatAge)}
							</Text>
						</View>

						<View style={[styles.metric, { backgroundColor: theme.card }]}>
							<Text style={[styles.metricLabel, { color: theme.textTertiary }]}>
								Observed ticks
							</Text>
							<Text
								testID="activity-probe-cover-heartbeat"
								style={[styles.metricValue, { color: theme.text }]}
							>
								{heartbeatCount}
							</Text>
						</View>
					</View>

					<Text style={[styles.body, { color: theme.textSecondary }]}>
						{status.title}. {status.body}
					</Text>

					<Pressable
						testID="activity-probe-close-cover"
						style={({ pressed }) => [
							styles.button,
							{
								backgroundColor: pressed
									? theme.actionButtonPressed
									: theme.actionButton,
							},
						]}
						onPress={() => router.back()}
					>
						<Text
							style={[styles.buttonText, { color: theme.actionButtonText }]}
						>
							Close sheet
						</Text>
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "transparent",
	},
	scrim: {
		flex: 1,
		justifyContent: "flex-end",
		padding: 16,
	},
	sheet: {
		borderRadius: 24,
		padding: 20,
		gap: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: "800",
	},
	body: {
		fontSize: 14,
		lineHeight: 20,
	},
	metricRow: {
		flexDirection: "row",
		gap: 12,
	},
	metric: {
		flex: 1,
		borderRadius: 14,
		padding: 14,
	},
	metricLabel: {
		fontSize: 12,
		fontWeight: "600",
		marginBottom: 6,
	},
	metricValue: {
		fontSize: 26,
		fontWeight: "800",
	},
	button: {
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "700",
	},
});
