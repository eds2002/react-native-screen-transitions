import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { ActionButton, DemoScreen, InfoCard } from "@/components/ui";
import { useTheme } from "@/theme";

export default function NestedGestureRuntimeScreen() {
	const navigation = useNavigation<any>();
	const stackType = useResolvedStackType();
	const theme = useTheme();
	const [gestureEnabled, setGestureEnabled] = useState(true);
	const suitePath = buildStackPath(stackType, "gestures");

	useEffect(() => {
		navigation.getParent()?.setOptions({
			gestureEnabled,
		} satisfies Partial<ScreenTransitionConfig>);
	}, [gestureEnabled, navigation]);

	useEffect(() => {
		return () => {
			navigation.getParent()?.setOptions({
				gestureEnabled: true,
			} satisfies Partial<ScreenTransitionConfig>);
		};
	}, [navigation]);

	return (
		<DemoScreen tint="#40505E">
			<ScreenHeader
				title="Nested Runtime Parent"
				subtitle="Child updates ancestor gestureEnabled"
				light
			/>
			<ScrollView
				testID="nested-gesture-runtime-screen"
				contentContainerStyle={styles.content}
				scrollEnabled={false}
			>
				<View style={styles.hero} testID="nested-gesture-runtime-status">
					<Text style={styles.eyebrow}>Ancestor Gesture</Text>
					<Text style={styles.status}>
						{gestureEnabled ? "Enabled" : "Disabled"}
					</Text>
					<Text style={styles.description}>
						This screen is inside nested/index. The route above it owns a
						vertical-only gesture, and these buttons update that route with
						navigation.getParent().setOptions.
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
						{"\u2022"} Disabled: drag down should move with resistance and
						reset.
					</Text>
					<Text style={[styles.note, { color: theme.textSecondary }]}>
						{"\u2022"} Enabled: drag down should dismiss the nested route.
					</Text>
					<Text style={[styles.note, { color: theme.textSecondary }]}>
						{"\u2022"} Horizontal drags should not dismiss this route.
					</Text>
				</InfoCard>

				<View style={styles.actions}>
					<ActionButton
						title="Enable Parent Gesture"
						onPress={() => setGestureEnabled(true)}
						disabled={gestureEnabled}
						testID="nested-gesture-enable-parent"
					/>
					<ActionButton
						title="Disable Parent Gesture"
						onPress={() => setGestureEnabled(false)}
						disabled={!gestureEnabled}
						variant="secondary"
						testID="nested-gesture-disable-parent"
					/>
					<ActionButton
						title="Dismiss To Suite"
						onPress={() => router.dismissTo(suitePath)}
						variant="secondary"
						testID="nested-gesture-dismiss-suite"
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
	actions: {
		gap: 12,
	},
});
