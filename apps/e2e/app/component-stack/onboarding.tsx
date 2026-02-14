import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ScreenInterpolationProps } from "react-native-screen-transitions";
import type { ComponentStackScreenProps } from "react-native-screen-transitions/component-stack";
import { createComponentStackNavigator } from "react-native-screen-transitions/component-stack";
import { ScreenHeader } from "@/components/screen-header";

type ParamList = {
	intro: undefined;
	step1: undefined;
	step2: undefined;
	step3: undefined;
	complete: undefined;
};

type Props = ComponentStackScreenProps<ParamList>;

const Stack = createComponentStackNavigator<ParamList>();

const transitionSpec = {
	open: { damping: 30, stiffness: 300, mass: 1 },
	close: { damping: 30, stiffness: 300, mass: 1 },
};

const slideInterpolator = (props: ScreenInterpolationProps) => {
	"worklet";
	const { progress, layouts } = props;
	const { width } = layouts.screen;

	const translateX = interpolate(progress, [0, 1, 2], [width, 0, -width * 0.3]);
	const scale = interpolate(progress, [0, 1, 2], [0.95, 1, 0.95]);

	return {
		contentStyle: {
			transform: [{ translateX }, { scale }],
		},
	};
};

function ProgressDots({ current, total }: { current: number; total: number }) {
	return (
		<View style={styles.progressContainer}>
			{Array.from({ length: total }, (_, i) => (
				<View
					key={i.toString()}
					style={[
						styles.progressDot,
						i <= current && styles.progressDotActive,
						i === current && styles.progressDotCurrent,
					]}
				/>
			))}
		</View>
	);
}

function IntroScreen({ navigation }: Props) {
	return (
		<View style={styles.screenContainer}>
			<ScreenHeader
				title="Onboarding"
				subtitle="Swipe back or tap buttons to navigate. Horizontal slide transitions."
			/>
			<View style={styles.introContent}>
				<View style={styles.iconContainer}>
					<Ionicons name="rocket" size={64} color="#007AFF" />
				</View>
				<Text style={styles.title}>Welcome</Text>
				<Text style={styles.subtitle}>Let&apos;s get started</Text>
				<Pressable
					style={styles.primaryButton}
					onPress={() => navigation.push("step1")}
				>
					<Text style={styles.primaryButtonText}>Begin Setup</Text>
				</Pressable>
			</View>
		</View>
	);
}

function StepScreen({
	navigation,
	stepIndex,
	icon,
	color,
	title,
	nextScreen,
}: Props & {
	stepIndex: number;
	icon: keyof typeof Ionicons.glyphMap;
	color: string;
	title: string;
	nextScreen: keyof ParamList;
}) {
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.stepContainer, { paddingTop: insets.top + 16 }]}>
			<View style={styles.stepHeader}>
				<Pressable onPress={() => navigation.goBack()} hitSlop={8}>
					<Ionicons name="arrow-back" size={24} color="#fff" />
				</Pressable>
				<ProgressDots current={stepIndex} total={3} />
				<Pressable onPress={() => navigation.push(nextScreen)} hitSlop={8}>
					<Text style={styles.skipText}>Skip</Text>
				</Pressable>
			</View>

			<View style={styles.stepContent}>
				<View style={[styles.stepIconContainer, { backgroundColor: color }]}>
					<Ionicons name={icon} size={48} color="#fff" />
				</View>
				<Text style={styles.stepTitle}>{title}</Text>
				<Text style={styles.stepSubtitle}>Step {stepIndex + 1} of 3</Text>
			</View>

			<View style={[styles.stepFooter, { paddingBottom: insets.bottom + 16 }]}>
				<Pressable
					style={styles.primaryButton}
					onPress={() => navigation.push(nextScreen)}
				>
					<Text style={styles.primaryButtonText}>Continue</Text>
				</Pressable>
			</View>
		</View>
	);
}

function Step1Screen(props: Props) {
	return (
		<StepScreen
			{...props}
			stepIndex={0}
			icon="color-palette"
			color="#007AFF"
			title="Choose Theme"
			nextScreen="step2"
		/>
	);
}

function Step2Screen(props: Props) {
	return (
		<StepScreen
			{...props}
			stepIndex={1}
			icon="notifications"
			color="#34C759"
			title="Notifications"
			nextScreen="step3"
		/>
	);
}

function Step3Screen(props: Props) {
	return (
		<StepScreen
			{...props}
			stepIndex={2}
			icon="link"
			color="#FF9500"
			title="Connect"
			nextScreen="complete"
		/>
	);
}

function CompleteScreen({ navigation }: Props) {
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.stepContainer, { paddingTop: insets.top + 16 }]}>
			<View style={styles.completeContent}>
				<Ionicons name="checkmark-circle" size={80} color="#34C759" />
				<Text style={styles.completeTitle}>All Done!</Text>
				<Text style={styles.completeSubtitle}>You&apos;re ready to go</Text>
			</View>

			<View style={[styles.stepFooter, { paddingBottom: insets.bottom + 16 }]}>
				<Pressable
					style={styles.primaryButton}
					onPress={() => navigation.popToTop()}
				>
					<Text style={styles.primaryButtonText}>Get Started</Text>
				</Pressable>
			</View>
		</View>
	);
}

export default function OnboardingDemo() {
	return (
		<View style={styles.container}>
			<Stack.Navigator initialRouteName="intro">
				<Stack.Screen
					name="intro"
					component={IntroScreen}
					options={{ gestureEnabled: false }}
				/>
				<Stack.Screen
					name="step1"
					component={Step1Screen}
					options={{
						screenStyleInterpolator: slideInterpolator,
						transitionSpec,
						gestureEnabled: true,
						gestureDirection: "horizontal",
					}}
				/>
				<Stack.Screen
					name="step2"
					component={Step2Screen}
					options={{
						screenStyleInterpolator: slideInterpolator,
						transitionSpec,
						gestureEnabled: true,
						gestureDirection: "horizontal",
					}}
				/>
				<Stack.Screen
					name="step3"
					component={Step3Screen}
					options={{
						screenStyleInterpolator: slideInterpolator,
						transitionSpec,
						gestureEnabled: true,
						gestureDirection: "horizontal",
					}}
				/>
				<Stack.Screen
					name="complete"
					component={CompleteScreen}
					options={{
						screenStyleInterpolator: slideInterpolator,
						transitionSpec,
						gestureEnabled: true,
						gestureDirection: "horizontal",
					}}
				/>
			</Stack.Navigator>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	screenContainer: {
		flex: 1,
		backgroundColor: "#121212",
	},
	introContent: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
	},
	iconContainer: {
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: "rgba(0,122,255,0.15)",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 24,
	},
	title: {
		fontSize: 32,
		fontWeight: "700",
		color: "#fff",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 18,
		color: "#888",
		marginBottom: 48,
	},
	primaryButton: {
		backgroundColor: "#007AFF",
		paddingVertical: 16,
		paddingHorizontal: 48,
		borderRadius: 12,
	},
	primaryButtonText: {
		fontSize: 17,
		fontWeight: "600",
		color: "#fff",
	},
	stepContainer: {
		flex: 1,
		backgroundColor: "#121212",
	},
	stepHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		marginBottom: 24,
	},
	skipText: {
		fontSize: 15,
		color: "#888",
	},
	progressContainer: {
		flexDirection: "row",
		gap: 8,
	},
	progressDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#333",
	},
	progressDotActive: {
		backgroundColor: "#007AFF",
	},
	progressDotCurrent: {
		width: 24,
	},
	stepContent: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
	},
	stepIconContainer: {
		width: 100,
		height: 100,
		borderRadius: 50,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 24,
	},
	stepTitle: {
		fontSize: 28,
		fontWeight: "700",
		color: "#fff",
		marginBottom: 8,
	},
	stepSubtitle: {
		fontSize: 16,
		color: "#888",
	},
	stepFooter: {
		paddingHorizontal: 24,
		paddingTop: 16,
	},
	completeContent: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
	},
	completeTitle: {
		fontSize: 32,
		fontWeight: "700",
		color: "#fff",
		marginTop: 16,
		marginBottom: 8,
	},
	completeSubtitle: {
		fontSize: 18,
		color: "#888",
	},
});
