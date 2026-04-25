import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { ActionButton, DemoScreen, InfoCard } from "@/components/ui";
import { useTheme } from "@/theme";

type RuntimeDirection = "horizontal" | "vertical" | "pinch-in";

const DIRECTIONS: { value: RuntimeDirection; label: string }[] = [
	{ value: "horizontal", label: "Horizontal" },
	{ value: "vertical", label: "Vertical" },
	{ value: "pinch-in", label: "Pinch In" },
];

export default function DynamicRuntimeGestureScreen() {
	const navigation = useNavigation<any>();
	const stackType = useResolvedStackType();
	const theme = useTheme();
	const [gestureEnabled, setGestureEnabled] = useState(true);
	const [gestureDirection, setGestureDirection] =
		useState<RuntimeDirection>("horizontal");

	useEffect(() => {
		navigation.setOptions({
			gestureEnabled,
			gestureDirection,
		} satisfies Partial<ScreenTransitionConfig>);
	}, [gestureEnabled, gestureDirection, navigation]);

	const suitePath = buildStackPath(stackType, "gestures");

	return (
		<DemoScreen tint="#3C4F35">
			<ScreenHeader
				title="Dynamic Runtime"
				subtitle="gestureEnabled + gestureDirection via setOptions"
				light
			/>
			<ScrollView
				testID="dynamic-runtime-screen"
				contentContainerStyle={styles.content}
				scrollEnabled={false}
			>
				<View style={styles.hero} testID="dynamic-runtime-status">
					<Text style={styles.eyebrow}>Current Runtime Options</Text>
					<Text style={styles.status}>
						{gestureEnabled ? "Enabled" : "Disabled"} / {gestureDirection}
					</Text>
					<Text style={styles.description}>
						These controls update screen options while this route stays mounted.
					</Text>
				</View>

				<InfoCard
					title="Runtime checks"
					style={{
						borderWidth: StyleSheet.hairlineWidth,
						backgroundColor: theme.infoBox,
						borderColor: theme.infoBorder,
					}}
				>
					<Text style={[styles.note, { color: theme.textSecondary }]}>
						{"\u2022"} Disable gestures, then drag: the screen should stay put.
					</Text>
					<Text style={[styles.note, { color: theme.textSecondary }]}>
						{"\u2022"} Re-enable and switch direction: the new gesture should
						work without leaving this screen.
					</Text>
					<Text style={[styles.note, { color: theme.textSecondary }]}>
						{"\u2022"} Pinch In should become available after switching from pan.
					</Text>
				</InfoCard>

				<View style={styles.controls}>
					<View style={styles.toggleRow}>
						<Pressable
							testID="dynamic-runtime-enable"
							style={[
								styles.control,
								gestureEnabled && styles.controlSelected,
							]}
							onPress={() => setGestureEnabled(true)}
						>
							<Text style={styles.controlText}>Enabled</Text>
						</Pressable>
						<Pressable
							testID="dynamic-runtime-disable"
							style={[
								styles.control,
								!gestureEnabled && styles.controlSelected,
							]}
							onPress={() => setGestureEnabled(false)}
						>
							<Text style={styles.controlText}>Disabled</Text>
						</Pressable>
					</View>

					<View style={styles.directionGrid}>
						{DIRECTIONS.map((item) => (
							<Pressable
								key={item.value}
								testID={`dynamic-runtime-${item.value}`}
								style={[
									styles.control,
									gestureDirection === item.value && styles.controlSelected,
								]}
								onPress={() => setGestureDirection(item.value)}
							>
								<Text style={styles.controlText}>{item.label}</Text>
							</Pressable>
						))}
					</View>
				</View>

				<View style={styles.actions}>
					<ActionButton
						title="Dismiss To Suite"
						onPress={() => router.dismissTo(suitePath)}
						testID="dynamic-runtime-dismiss-suite"
					/>
				</View>
			</ScrollView>
		</DemoScreen>
	);
}

const styles = StyleSheet.create({
	content: {
		padding: 16,
		gap: 16,
	},
	hero: {
		borderRadius: 24,
		padding: 20,
		backgroundColor: "rgba(255,255,255,0.1)",
		gap: 8,
	},
	eyebrow: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
		color: "rgba(255,255,255,0.8)",
	},
	status: {
		fontSize: 28,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	description: {
		fontSize: 15,
		lineHeight: 22,
		color: "rgba(255,255,255,0.84)",
	},
	note: {
		fontSize: 14,
		lineHeight: 21,
	},
	controls: {
		gap: 12,
	},
	toggleRow: {
		flexDirection: "row",
		gap: 10,
	},
	directionGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
	},
	control: {
		flexGrow: 1,
		minWidth: 104,
		alignItems: "center",
		borderRadius: 14,
		paddingVertical: 14,
		paddingHorizontal: 12,
		backgroundColor: "rgba(255,255,255,0.14)",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.18)",
	},
	controlSelected: {
		backgroundColor: "rgba(255,255,255,0.28)",
		borderColor: "rgba(255,255,255,0.42)",
	},
	controlText: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "700",
	},
	actions: {
		gap: 12,
	},
});
