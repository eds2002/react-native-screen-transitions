import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
	PanResponder,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import { GESTURE_EXAMPLES } from "./shared";
import { gestureSensitivityMultiplier } from "./transitions";

const MIN_SENSITIVITY = 0.25;
const MAX_SENSITIVITY = 2;

function clampSensitivity(value: number) {
	return Math.min(MAX_SENSITIVITY, Math.max(MIN_SENSITIVITY, value));
}

export default function GesturesSuiteIndex() {
	const theme = useTheme();
	const stackType = useResolvedStackType();
	const [trackWidth, setTrackWidth] = useState(1);
	const [sensitivity, setSensitivity] = useState(() =>
		clampSensitivity(gestureSensitivityMultiplier.get()),
	);

	const setGlobalSensitivity = useCallback((value: number) => {
		const next = clampSensitivity(value);
		gestureSensitivityMultiplier.set(next);
		setSensitivity(next);
	}, []);

	const setFromTrackX = useCallback(
		(x: number) => {
			const ratio = Math.min(1, Math.max(0, x / trackWidth));
			setGlobalSensitivity(
				MIN_SENSITIVITY + ratio * (MAX_SENSITIVITY - MIN_SENSITIVITY),
			);
		},
		[setGlobalSensitivity, trackWidth],
	);

	const panResponder = useMemo(
		() =>
			PanResponder.create({
				onStartShouldSetPanResponder: () => true,
				onMoveShouldSetPanResponder: () => true,
				onPanResponderGrant: (event) => {
					setFromTrackX(event.nativeEvent.locationX);
				},
				onPanResponderMove: (event) => {
					setFromTrackX(event.nativeEvent.locationX);
				},
			}),
		[setFromTrackX],
	);

	const sliderRatio =
		(sensitivity - MIN_SENSITIVITY) / (MAX_SENSITIVITY - MIN_SENSITIVITY);

	return (
		<SafeAreaView
			style={[styles.screen, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Gestures"
				subtitle="One focused route per gesture direction, including pinch"
			/>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={[styles.sliderCard, { backgroundColor: theme.card }]}>
					<View style={styles.sliderHeader}>
						<Text style={[styles.sliderTitle, { color: theme.text }]}>
							Runtime sensitivity
						</Text>
						<Text style={[styles.sliderValue, { color: theme.textSecondary }]}>
							{sensitivity.toFixed(2)}x
						</Text>
					</View>
					<Text
						style={[styles.sliderDescription, { color: theme.textSecondary }]}
					>
						Shared makeMutable value read by each screenStyleInterpolator when
						it returns options.gestures.gestureSensitivity.
					</Text>
					<View
						testID="gesture-sensitivity-slider"
						style={[styles.sliderTrack, { backgroundColor: theme.cardPressed }]}
						onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
						{...panResponder.panHandlers}
					>
						<View
							style={[
								styles.sliderFill,
								{
									width: `${sliderRatio * 100}%`,
									backgroundColor: theme.actionButton,
								},
							]}
						/>
						<View
							style={[
								styles.sliderThumb,
								{
									left: `${sliderRatio * 100}%`,
									backgroundColor: theme.actionButton,
								},
							]}
						/>
					</View>
				</View>

				<View style={styles.list}>
					{GESTURE_EXAMPLES.map((item) => (
						<Pressable
							key={item.id}
							testID={`gesture-suite-${item.id}`}
							style={({ pressed }) => [
								styles.listItem,
								{ backgroundColor: pressed ? theme.cardPressed : theme.card },
							]}
							onPress={() =>
								router.push(
									buildStackPath(stackType, `gestures/${item.id}`) as never,
								)
							}
						>
							<Text style={[styles.listItemTitle, { color: theme.text }]}>
								{item.title}
							</Text>
							<Text
								style={[
									styles.listItemDescription,
									{ color: theme.textSecondary },
								]}
							>
								{item.description}
							</Text>
						</Pressable>
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	content: {
		padding: 20,
		gap: 14,
	},
	sliderCard: {
		borderRadius: 14,
		padding: 16,
		gap: 10,
	},
	sliderHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	sliderTitle: {
		fontSize: 17,
		fontWeight: "700",
	},
	sliderValue: {
		fontSize: 15,
		fontWeight: "700",
	},
	sliderDescription: {
		fontSize: 13,
		lineHeight: 19,
	},
	sliderTrack: {
		height: 28,
		borderRadius: 14,
		justifyContent: "center",
		overflow: "hidden",
	},
	sliderFill: {
		position: "absolute",
		left: 0,
		top: 0,
		bottom: 0,
	},
	sliderThumb: {
		position: "absolute",
		width: 18,
		height: 18,
		borderRadius: 9,
		marginLeft: -9,
	},
	list: {
		gap: 12,
	},
	listItem: {
		borderRadius: 14,
		padding: 18,
	},
	listItemTitle: {
		fontSize: 18,
		fontWeight: "700",
		marginBottom: 4,
	},
	listItemDescription: {
		fontSize: 14,
		lineHeight: 20,
	},
});
