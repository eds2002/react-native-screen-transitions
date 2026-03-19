import { Ionicons } from "@expo/vector-icons";
import { createContext, useContext, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
import type { ScreenInterpolationProps } from "react-native-screen-transitions";
import {
	type BlankStackScreenProps,
	createBlankStackNavigator,
} from "react-native-screen-transitions/blank-stack";
import { ScreenHeader } from "@/components/screen-header";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";

type EmbeddedFlowMode = "native" | "views";

type FlowParamList = {
	welcome: undefined;
	permissions: undefined;
	done: undefined;
};

type FlowScreenProps = BlankStackScreenProps<FlowParamList>;

const MODE_OPTIONS: {
	id: EmbeddedFlowMode;
	title: string;
	description: string;
	code: string;
	note: string;
}[] = [
	{
		id: "native",
		title: "Native Screens",
		description: "Uses RNSScreen and ScreenContainer inside the isolated flow",
		code: "createBlankStackNavigator({ independent: true, enableNativeScreens: true })",
		note: "Best when you want native freezing and activity state inside the embedded flow.",
	},
	{
		id: "views",
		title: "Regular Views",
		description:
			"Uses plain views for the embedded flow instead of native screens",
		code: "createBlankStackNavigator({ independent: true, enableNativeScreens: false })",
		note: "Useful when you want the embedded-flow shape without relying on react-native-screens layering.",
	},
];

const EmbeddedFlowModeContext = createContext<EmbeddedFlowMode>("native");

const MODE_BADGE = {
	native: {
		label: "Native screens active",
		detail: "RNSScreen + ScreenContainer",
		backgroundColor: "#163125",
		borderColor: "#2C6C50",
		textColor: "#8BE7BB",
	},
	views: {
		label: "Regular views active",
		detail: "Animated.View + View",
		backgroundColor: "#2D2113",
		borderColor: "#7A5523",
		textColor: "#F2C37C",
	},
} satisfies Record<
	EmbeddedFlowMode,
	{
		label: string;
		detail: string;
		backgroundColor: string;
		borderColor: string;
		textColor: string;
	}
>;

const transitionSpec = {
	open: { damping: 30, stiffness: 300, mass: 1 },
	close: { damping: 30, stiffness: 300, mass: 1 },
};

const IsolatedNativeFlow = createBlankStackNavigator<FlowParamList>({
	independent: true,
	enableNativeScreens: true,
});

const IsolatedViewFlow = createBlankStackNavigator<FlowParamList>({
	independent: true,
	enableNativeScreens: false,
});

const slideFromRight = (props: ScreenInterpolationProps) => {
	"worklet";
	const { progress, layouts } = props;
	const { width } = layouts.screen;

	return {
		content: {
			style: {
				transform: [
					{
						translateX: interpolate(
							progress,
							[0, 1, 2],
							[width, 0, -width * 0.22],
						),
					},
				],
			},
		},
	};
};

function FlowStep({
	step,
	title,
	subtitle,
	iconName,
	accentColor,
	primaryLabel,
	onPrimary,
	onBack,
}: {
	step: string;
	title: string;
	subtitle: string;
	iconName: keyof typeof Ionicons.glyphMap;
	accentColor: string;
	primaryLabel: string;
	onPrimary: () => void;
	onBack?: () => void;
}) {
	const mode = useContext(EmbeddedFlowModeContext);
	const badge = MODE_BADGE[mode];

	return (
		<View style={styles.flowScreen}>
			<View style={styles.flowHeader}>
				{onBack ? (
					<Pressable onPress={onBack} hitSlop={8} style={styles.iconButton}>
						<Ionicons name="arrow-back" size={18} color="#fff" />
					</Pressable>
				) : (
					<View style={styles.iconButtonSpacer} />
				)}
				<Text style={styles.stepLabel}>{step}</Text>
				<View style={styles.iconButtonSpacer} />
			</View>

			<View
				style={[
					styles.modeBadge,
					{
						backgroundColor: badge.backgroundColor,
						borderColor: badge.borderColor,
					},
				]}
			>
				<Text style={[styles.modeBadgeLabel, { color: badge.textColor }]}>
					{badge.label}
				</Text>
				<Text style={styles.modeBadgeDetail}>{badge.detail}</Text>
			</View>

			<View style={styles.flowBody}>
				<View
					style={[
						styles.flowIcon,
						{
							backgroundColor: `${accentColor}22`,
							borderColor: `${accentColor}55`,
						},
					]}
				>
					<Ionicons name={iconName} size={28} color={accentColor} />
				</View>
				<Text style={styles.flowTitle}>{title}</Text>
				<Text style={styles.flowSubtitle}>{subtitle}</Text>
			</View>

			<Pressable style={styles.primaryButton} onPress={onPrimary}>
				<Text style={styles.primaryButtonText}>{primaryLabel}</Text>
			</Pressable>
		</View>
	);
}

function WelcomeScreen({ navigation }: FlowScreenProps) {
	return (
		<FlowStep
			step="Step 1 of 3"
			title="Embedded Flow"
			subtitle="This navigator is isolated from the outer stack and manages its own history."
			iconName="layers"
			accentColor="#6EE7B7"
			primaryLabel="Next"
			onPrimary={() => navigation.push("permissions")}
		/>
	);
}

function PermissionsScreen({ navigation }: FlowScreenProps) {
	return (
		<FlowStep
			step="Step 2 of 3"
			title="Choose Mode"
			subtitle="Swap the toggle above to remount this embedded blank stack with a different navigator configuration."
			iconName="options"
			accentColor="#60A5FA"
			primaryLabel="Finish"
			onPrimary={() => navigation.push("done")}
			onBack={() => navigation.goBack()}
		/>
	);
}

function DoneScreen({ navigation }: FlowScreenProps) {
	return (
		<FlowStep
			step="Step 3 of 3"
			title="Done"
			subtitle="The outer screen stays in place while the inner flow pushes and pops independently."
			iconName="checkmark-circle"
			accentColor="#F59E0B"
			primaryLabel="Restart"
			onPrimary={() => navigation.popToTop()}
			onBack={() => navigation.goBack()}
		/>
	);
}

function EmbeddedFlowPreview({ mode }: { mode: EmbeddedFlowMode }) {
	const Flow = mode === "native" ? IsolatedNativeFlow : IsolatedViewFlow;

	return (
		<EmbeddedFlowModeContext.Provider value={mode}>
			<Flow.Navigator key={mode} initialRouteName="welcome">
				<Flow.Screen
					name="welcome"
					component={WelcomeScreen}
					options={{ gestureEnabled: false }}
				/>
				<Flow.Screen
					name="permissions"
					component={PermissionsScreen}
					options={{
						screenStyleInterpolator: slideFromRight,
						transitionSpec,
						gestureEnabled: true,
						gestureDirection: "horizontal",
					}}
				/>
				<Flow.Screen
					name="done"
					component={DoneScreen}
					options={{
						screenStyleInterpolator: slideFromRight,
						transitionSpec,
						gestureEnabled: true,
						gestureDirection: "horizontal",
					}}
				/>
			</Flow.Navigator>
		</EmbeddedFlowModeContext.Provider>
	);
}

export default function EmbeddedFlowExample() {
	const stackType = useResolvedStackType();
	const [mode, setMode] = useState<EmbeddedFlowMode>("native");
	const selectedMode =
		MODE_OPTIONS.find((option) => option.id === mode) ?? MODE_OPTIONS[0];
	const outerStackLabel =
		stackType === "native-stack" ? "Native Stack" : "Blank Stack";

	const insets = useSafeAreaInsets();
	return (
		<ScrollView
			style={[styles.container]} 
			contentContainerStyle={{
				paddingTop: insets.top,
				paddingBottom: insets.bottom,
			}}
		>
			<ScreenHeader
				title="Embedded Blank Stack"
				subtitle={`Outer stack: ${outerStackLabel}`}
			/>

			<View style={styles.content}>
				<View style={styles.infoBox}>
					<Text style={styles.infoTitle}>Navigator-level options</Text>
					<Text style={styles.infoText}>
						This example keeps the outer screen fixed and remounts an embedded{" "}
						<Text style={styles.highlight}>blank stack</Text> with
						<Text style={styles.highlight}> independent: true</Text>.
					</Text>
				</View>

				<View style={styles.toggleRow}>
					{MODE_OPTIONS.map((option) => {
						const isActive = option.id === mode;
						return (
							<Pressable
								key={option.id}
								testID={`embedded-flow-${option.id}`}
								style={[
									styles.toggleButton,
									isActive && styles.toggleButtonActive,
								]}
								onPress={() => setMode(option.id)}
							>
								<Text
									style={[
										styles.toggleTitle,
										isActive && styles.toggleTitleActive,
									]}
								>
									{option.title}
								</Text>
								<Text
									style={[
										styles.toggleDescription,
										isActive && styles.toggleDescriptionActive,
									]}
								>
									{option.description}
								</Text>
							</Pressable>
						);
					})}
				</View>

				<View style={styles.configBox}>
					<Text style={styles.configLabel}>Current setup</Text>
					<Text style={styles.configCode}>{selectedMode.code}</Text>
					<Text style={styles.configNote}>{selectedMode.note}</Text>
				</View>

				<View style={styles.previewCard}>
					<EmbeddedFlowPreview mode={mode} />
				</View>

				<View style={styles.noteBox}>
					<Text style={styles.noteText}>
						Use this page to compare the same embedded flow with native screens
						on versus off. The isolation behavior comes from the navigator
						factory, not from a separate stack type.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	content: {
		flex: 1,
		padding: 16,
		gap: 16,
	},
	infoBox: {
		backgroundColor: "#1c2433",
		borderRadius: 14,
		padding: 14,
		borderWidth: 1,
		borderColor: "#314059",
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#9CC2FF",
		marginBottom: 6,
	},
	infoText: {
		fontSize: 13,
		lineHeight: 19,
		color: "#C4CDD8",
	},
	highlight: {
		color: "#FFFFFF",
		fontWeight: "700",
	},
	toggleRow: {
		flexDirection: "row",
		gap: 12,
	},
	toggleButton: {
		flex: 1,
		backgroundColor: "#1b1b1b",
		borderRadius: 14,
		padding: 14,
		borderWidth: 1,
		borderColor: "#333",
	},
	toggleButtonActive: {
		backgroundColor: "#23324D",
		borderColor: "#5B84D7",
	},
	toggleTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#FFFFFF",
		marginBottom: 6,
	},
	toggleTitleActive: {
		color: "#DCE8FF",
	},
	toggleDescription: {
		fontSize: 12,
		lineHeight: 17,
		color: "#8B93A1",
	},
	toggleDescriptionActive: {
		color: "#B8C8EA",
	},
	configBox: {
		backgroundColor: "#171717",
		borderRadius: 14,
		padding: 14,
		borderWidth: 1,
		borderColor: "#2C2C2C",
		gap: 6,
	},
	configLabel: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 0.5,
		textTransform: "uppercase",
		color: "#8B93A1",
	},
	configCode: {
		fontSize: 12,
		lineHeight: 18,
		color: "#E5E7EB",
		fontFamily: "Courier",
	},
	configNote: {
		fontSize: 12,
		lineHeight: 18,
		color: "#9CA3AF",
	},
	previewCard: {
		flex: 1,
		minHeight: 600,
		borderRadius: 20,
		overflow: "hidden",
		backgroundColor: "#1A1E27",
		borderWidth: 1,
		borderColor: "#2F394A",
	},
	noteBox: {
		backgroundColor: "#1F1A12",
		borderRadius: 12,
		padding: 12,
		borderWidth: 1,
		borderColor: "#4D3B12",
	},
	noteText: {
		fontSize: 12,
		lineHeight: 18,
		color: "#F0C36A",
	},
	flowScreen: {
		flex: 1,
		backgroundColor: "#1A1E27",
		padding: 18,
	},
	flowHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	iconButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "rgba(255,255,255,0.08)",
		alignItems: "center",
		justifyContent: "center",
	},
	iconButtonSpacer: {
		width: 32,
		height: 32,
	},
	stepLabel: {
		fontSize: 13,
		fontWeight: "700",
		color: "#9CA3AF",
	},
	flowBody: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 16,
	},
	modeBadge: {
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 10,
		gap: 2,
	},
	modeBadgeLabel: {
		fontSize: 12,
		fontWeight: "700",
	},
	modeBadgeDetail: {
		fontSize: 11,
		color: "#B7C0CF",
	},
	flowIcon: {
		width: 72,
		height: 72,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		marginBottom: 18,
	},
	flowTitle: {
		fontSize: 24,
		fontWeight: "700",
		color: "#FFFFFF",
		marginBottom: 8,
		textAlign: "center",
	},
	flowSubtitle: {
		fontSize: 14,
		lineHeight: 20,
		color: "#B7C0CF",
		textAlign: "center",
	},
	primaryButton: {
		backgroundColor: "#3B82F6",
		borderRadius: 14,
		paddingVertical: 15,
		alignItems: "center",
	},
	primaryButtonText: {
		fontSize: 15,
		fontWeight: "700",
		color: "#FFFFFF",
	},
});
