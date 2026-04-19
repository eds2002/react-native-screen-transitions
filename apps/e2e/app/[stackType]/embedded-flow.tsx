import { Ionicons } from "@expo/vector-icons";
import { createContext, useContext, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ScreenInterpolationProps } from "react-native-screen-transitions";
import {
	type BlankStackScreenProps,
	createBlankStackNavigator,
} from "react-native-screen-transitions/blank-stack";
import { ScreenHeader } from "@/components/screen-header";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

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
		code: "<Flow.Navigator independent enableNativeScreens={false}>",
		note: "Useful when you want the embedded-flow shape without relying on react-native-screens layering.",
	},
];

const EmbeddedFlowModeContext = createContext<EmbeddedFlowMode>("native");

const transitionSpec = {
	open: { damping: 30, stiffness: 300, mass: 1 },
	close: { damping: 30, stiffness: 300, mass: 1 },
};

const Flow = createBlankStackNavigator<FlowParamList>();

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
	const theme = useTheme();

	const badgeConfig =
		mode === "native"
			? {
					label: "Native screens active",
					detail: "RNSScreen + ScreenContainer",
				}
			: { label: "Regular views active", detail: "Animated.View + View" };

	return (
		<View style={[styles.flowScreen, { backgroundColor: theme.surface }]}>
			<View style={styles.flowHeader}>
				{onBack ? (
					<Pressable
						onPress={onBack}
						hitSlop={8}
						style={[
							styles.iconButton,
							{ backgroundColor: theme.secondaryButton },
						]}
					>
						<Ionicons name="arrow-back" size={18} color={theme.text} />
					</Pressable>
				) : (
					<View style={styles.iconButtonSpacer} />
				)}
				<Text style={[styles.stepLabel, { color: theme.textTertiary }]}>
					{step}
				</Text>
				<View style={styles.iconButtonSpacer} />
			</View>

			<View
				style={[
					styles.modeBadge,
					{
						backgroundColor: mode === "native" ? theme.infoBox : theme.noteBox,
					},
				]}
			>
				<Text
					style={[
						styles.modeBadgeLabel,
						{ color: mode === "native" ? theme.infoBoxLabel : theme.noteText },
					]}
				>
					{badgeConfig.label}
				</Text>
				<Text style={[styles.modeBadgeDetail, { color: theme.textSecondary }]}>
					{badgeConfig.detail}
				</Text>
			</View>

			<View style={styles.flowBody}>
				<View
					style={[
						styles.flowIcon,
						{
							backgroundColor: `${accentColor}22`,
						},
					]}
				>
					<Ionicons name={iconName} size={28} color={accentColor} />
				</View>
				<Text style={[styles.flowTitle, { color: theme.text }]}>{title}</Text>
				<Text style={[styles.flowSubtitle, { color: theme.textSecondary }]}>
					{subtitle}
				</Text>
			</View>

			<Pressable
				style={({ pressed }) => [
					styles.primaryButton,
					{
						backgroundColor: pressed
							? theme.actionButtonPressed
							: theme.actionButton,
					},
				]}
				onPress={onPrimary}
			>
				<Text
					style={[styles.primaryButtonText, { color: theme.actionButtonText }]}
				>
					{primaryLabel}
				</Text>
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
	return (
		<EmbeddedFlowModeContext.Provider value={mode}>
			<Flow.Navigator
				key={mode}
				independent
				enableNativeScreens={mode === "native"}
				initialRouteName="welcome"
			>
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
	const theme = useTheme();

	const insets = useSafeAreaInsets();
	return (
		<ScrollView
			style={[styles.container, { backgroundColor: theme.bg }]}
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
				<View style={[styles.infoBox, { backgroundColor: theme.infoBox }]}>
					<Text style={[styles.infoTitle, { color: theme.infoBoxLabel }]}>
						Navigator-level options
					</Text>
					<Text style={[styles.infoText, { color: theme.textSecondary }]}>
						This example keeps the outer screen fixed and remounts an embedded{" "}
						<Text style={[styles.highlight, { color: theme.text }]}>
							blank stack
						</Text>{" "}
						with
						<Text style={[styles.highlight, { color: theme.text }]}>
							{" "}
							independent: true
						</Text>
						.
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
									{ backgroundColor: isActive ? theme.activePill : theme.pill },
								]}
								onPress={() => setMode(option.id)}
							>
								<Text
									style={[
										styles.toggleTitle,
										{ color: isActive ? theme.activePillText : theme.pillText },
									]}
								>
									{option.title}
								</Text>
								<Text
									style={[
										styles.toggleDescription,
										{
											color: isActive
												? theme.activePillText
												: theme.textTertiary,
										},
									]}
								>
									{option.description}
								</Text>
							</Pressable>
						);
					})}
				</View>

				<View style={[styles.configBox, { backgroundColor: theme.card }]}>
					<Text style={[styles.configLabel, { color: theme.textTertiary }]}>
						Current setup
					</Text>
					<Text style={[styles.configCode, { color: theme.text }]}>
						{selectedMode.code}
					</Text>
					<Text style={[styles.configNote, { color: theme.textSecondary }]}>
						{selectedMode.note}
					</Text>
				</View>

				<View style={[styles.previewCard, { backgroundColor: theme.surface }]}>
					<EmbeddedFlowPreview mode={mode} />
				</View>

				<View style={[styles.noteBox, { backgroundColor: theme.noteBox }]}>
					<Text style={[styles.noteText, { color: theme.noteText }]}>
						Use this page to compare the same embedded flow with native screens
						on versus off. The isolation behavior comes from the navigator
						props, not from a separate stack type.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		padding: 16,
		gap: 16,
	},
	infoBox: {
		borderRadius: 14,
		padding: 14,
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: "700",
		marginBottom: 6,
	},
	infoText: {
		fontSize: 13,
		lineHeight: 19,
	},
	highlight: {
		fontWeight: "700",
	},
	toggleRow: {
		flexDirection: "row",
		gap: 12,
	},
	toggleButton: {
		flex: 1,
		borderRadius: 14,
		padding: 14,
	},
	toggleTitle: {
		fontSize: 14,
		fontWeight: "700",
		marginBottom: 6,
	},
	toggleDescription: {
		fontSize: 12,
		lineHeight: 17,
	},
	configBox: {
		borderRadius: 14,
		padding: 14,
		gap: 6,
	},
	configLabel: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 0.5,
		textTransform: "uppercase",
	},
	configCode: {
		fontSize: 12,
		lineHeight: 18,
		fontFamily: "Courier",
	},
	configNote: {
		fontSize: 12,
		lineHeight: 18,
	},
	previewCard: {
		flex: 1,
		minHeight: 600,
		borderRadius: 20,
		overflow: "hidden",
	},
	noteBox: {
		borderRadius: 14,
		padding: 12,
	},
	noteText: {
		fontSize: 12,
		lineHeight: 18,
	},
	flowScreen: {
		flex: 1,
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
	},
	flowBody: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 16,
	},
	modeBadge: {
		borderRadius: 14,
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
	},
	flowIcon: {
		width: 72,
		height: 72,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 18,
	},
	flowTitle: {
		fontSize: 24,
		fontWeight: "700",
		marginBottom: 8,
		textAlign: "center",
	},
	flowSubtitle: {
		fontSize: 14,
		lineHeight: 20,
		textAlign: "center",
	},
	primaryButton: {
		borderRadius: 999,
		paddingVertical: 15,
		alignItems: "center",
	},
	primaryButtonText: {
		fontSize: 15,
		fontWeight: "700",
	},
});
