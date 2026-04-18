import { useRoute } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Pressable,
	type View as RNView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";
import {
	BoundStore,
	type MeasuredEntry,
} from "../../../../../../packages/react-native-screen-transitions/src/shared/stores/bounds";
import { OPENING_TRANSFORM_BOUNDARY_ID } from "./constants";

type WindowMeasurement = {
	pageX: number;
	pageY: number;
	width: number;
	height: number;
};

const ENTRY_POLL_MS = 40;
const STABLE_MEASURE_DELAY_MS = 900;

const formatMeasurement = (measurement: WindowMeasurement | null) => {
	if (!measurement) {
		return "waiting";
	}

	return `x ${measurement.pageX.toFixed(1)} | y ${measurement.pageY.toFixed(
		1,
	)} | w ${measurement.width.toFixed(1)} | h ${measurement.height.toFixed(1)}`;
};

const formatMeasuredEntry = (entry: MeasuredEntry | null) => {
	if (!entry) {
		return "waiting";
	}

	const { bounds } = entry;
	return `x ${bounds.pageX.toFixed(1)} | y ${bounds.pageY.toFixed(
		1,
	)} | w ${bounds.width.toFixed(1)} | h ${bounds.height.toFixed(1)}`;
};

export default function OpeningTransformBoundsDestination() {
	const theme = useTheme();
	const route = useRoute();
	const boundaryRef = useRef<RNView>(null);
	const [capturedEntry, setCapturedEntry] = useState<MeasuredEntry | null>(
		null,
	);
	const [stableMeasurement, setStableMeasurement] =
		useState<WindowMeasurement | null>(null);

	const captureStableMeasurement = useCallback(() => {
		boundaryRef.current?.measureInWindow((pageX, pageY, width, height) => {
			setStableMeasurement({
				pageX,
				pageY,
				width,
				height,
			});
		});
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			setCapturedEntry((previous) => {
				if (previous) {
					return previous;
				}

				return BoundStore.entry.getMeasured(
					OPENING_TRANSFORM_BOUNDARY_ID,
					route.key,
				);
			});
		}, ENTRY_POLL_MS);

		return () => clearInterval(interval);
	}, [route.key]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			captureStableMeasurement();
		}, STABLE_MEASURE_DELAY_MS);

		return () => clearTimeout(timeout);
	}, [captureStableMeasurement]);

	const delta = useMemo(() => {
		if (!capturedEntry || !stableMeasurement) {
			return null;
		}

		return {
			pageX: stableMeasurement.pageX - capturedEntry.bounds.pageX,
			pageY: stableMeasurement.pageY - capturedEntry.bounds.pageY,
			width: stableMeasurement.width - capturedEntry.bounds.width,
			height: stableMeasurement.height - capturedEntry.bounds.height,
		};
	}, [capturedEntry, stableMeasurement]);

	const mismatchSummary = useMemo(() => {
		if (!delta) {
			return "waiting";
		}

		return `dx ${delta.pageX.toFixed(1)} | dy ${delta.pageY.toFixed(
			1,
		)} | dw ${delta.width.toFixed(1)} | dh ${delta.height.toFixed(1)}`;
	}, [delta]);

	const status = useMemo(() => {
		if (!delta) {
			return "Waiting for both measurements";
		}

		const maxDelta = Math.max(
			Math.abs(delta.pageX),
			Math.abs(delta.pageY),
			Math.abs(delta.width),
			Math.abs(delta.height),
		);

		return maxDelta <= 1
			? "Stored measurement matches settled layout"
			: "Stored measurement drift detected";
	}, [delta]);

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Opening Transform Probe"
				subtitle="Stored destination measurement vs settled destination layout"
			/>

			<View style={styles.content}>
				<View style={styles.arena}>
					<View
						ref={boundaryRef}
						collapsable={false}
						style={styles.boundaryWrapper}
					>
						<Transition.Boundary.View
							id={OPENING_TRANSFORM_BOUNDARY_ID}
							style={[
								styles.destinationCard,
								{ backgroundColor: theme.scenario },
							]}
						>
							<Text style={[styles.destinationLabel, { color: theme.text }]}>
								Destination
							</Text>
						</Transition.Boundary.View>
					</View>
				</View>

				<View style={styles.metricsColumn}>
					<View style={[styles.metricCard, { backgroundColor: theme.card }]}>
						<Text style={[styles.metricLabel, { color: theme.textTertiary }]}>
							Stored measurement
						</Text>
						<Text
							testID="opening-transform-measured-entry"
							style={[styles.metricValue, { color: theme.text }]}
						>
							{formatMeasuredEntry(capturedEntry)}
						</Text>
					</View>

					<View style={[styles.metricCard, { backgroundColor: theme.card }]}>
						<Text style={[styles.metricLabel, { color: theme.textTertiary }]}>
							Settled layout
						</Text>
						<Text
							testID="opening-transform-settled"
							style={[styles.metricValue, { color: theme.text }]}
						>
							{formatMeasurement(stableMeasurement)}
						</Text>
					</View>

					<View style={[styles.metricCard, { backgroundColor: theme.card }]}>
						<Text style={[styles.metricLabel, { color: theme.textTertiary }]}>
							Delta
						</Text>
						<Text
							testID="opening-transform-delta"
							style={[styles.metricValue, { color: theme.text }]}
						>
							{mismatchSummary}
						</Text>
						<Text
							testID="opening-transform-status"
							style={[styles.metricStatus, { color: theme.textSecondary }]}
						>
							{status}
						</Text>
					</View>
				</View>

				<View style={styles.buttonRow}>
					<Pressable
						testID="opening-transform-refresh"
						style={[
							styles.secondaryButton,
							{
								borderColor: theme.separator,
								backgroundColor: theme.card,
							},
						]}
						onPress={captureStableMeasurement}
					>
						<Text style={[styles.secondaryButtonText, { color: theme.text }]}>
							Refresh settled measurement
						</Text>
					</Pressable>

					<Pressable
						testID="opening-transform-back"
						style={[
							styles.primaryButton,
							{ backgroundColor: theme.actionButton },
						]}
						onPress={() => router.back()}
					>
						<Text
							style={[
								styles.primaryButtonText,
								{ color: theme.actionButtonText },
							]}
						>
							Go back
						</Text>
					</Pressable>
				</View>

				<View style={[styles.noteCard, { backgroundColor: theme.noteBox }]}>
					<Text style={[styles.noteTitle, { color: theme.noteText }]}>
						How to read this
					</Text>
					<Text style={[styles.noteBody, { color: theme.textSecondary }]}>
						If the destination boundary was measured while the opening screen
						still owned its translated and scaled content styles, the captured
						measurement will drift away from the settled layout. If blocked
						opens hide content and reset styles before measurement, this delta
						should collapse back toward zero.
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
		paddingHorizontal: 16,
		paddingBottom: 24,
		gap: 16,
	},
	arena: {
		height: 260,
		alignItems: "center",
		justifyContent: "center",
	},
	boundaryWrapper: {
		width: 280,
		height: 180,
	},
	destinationCard: {
		flex: 1,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	destinationLabel: {
		fontSize: 22,
		fontWeight: "800",
	},
	metricsColumn: {
		gap: 12,
	},
	metricCard: {
		borderRadius: 14,
		padding: 14,
	},
	metricLabel: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.7,
	},
	metricValue: {
		marginTop: 8,
		fontSize: 13,
		lineHeight: 20,
		fontFamily: "monospace",
	},
	metricStatus: {
		marginTop: 8,
		fontSize: 13,
		lineHeight: 18,
	},
	buttonRow: {
		gap: 12,
	},
	secondaryButton: {
		borderWidth: 1,
		borderRadius: 14,
		paddingVertical: 14,
		alignItems: "center",
	},
	secondaryButtonText: {
		fontSize: 15,
		fontWeight: "700",
	},
	primaryButton: {
		borderRadius: 14,
		paddingVertical: 15,
		alignItems: "center",
	},
	primaryButtonText: {
		fontSize: 16,
		fontWeight: "700",
	},
	noteCard: {
		padding: 14,
		borderRadius: 14,
	},
	noteTitle: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.8,
	},
	noteBody: {
		marginTop: 6,
		fontSize: 13,
		lineHeight: 20,
	},
});
