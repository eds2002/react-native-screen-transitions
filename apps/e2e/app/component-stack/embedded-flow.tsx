import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ScreenInterpolationProps } from "react-native-screen-transitions";
import type { ComponentStackScreenProps } from "react-native-screen-transitions/component-stack";
import { createComponentStackNavigator } from "react-native-screen-transitions/component-stack";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

// --- Embedded component stack ---

type ParamList = {
	step1: undefined;
	step2: undefined;
	step3: undefined;
};

type Props = ComponentStackScreenProps<ParamList>;

const Flow = createComponentStackNavigator<ParamList>();

const transitionSpec = {
	open: { damping: 30, stiffness: 300, mass: 1 },
	close: { damping: 30, stiffness: 300, mass: 1 },
};

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
							[width, 0, -width * 0.3],
						),
					},
				],
			},
		},
	};
};

function Step1({ navigation }: Props) {
	const theme = useTheme();

	return (
		<View style={[innerStyles.screen, { backgroundColor: theme.surface }]}>
			<View style={innerStyles.header}>
				<Text style={[innerStyles.stepLabel, { color: theme.textTertiary }]}>Step 1 of 3</Text>
			</View>
			<View style={innerStyles.body}>
				<View
					style={[innerStyles.icon, { backgroundColor: theme.actionButton + "33" }]}
				>
					<Ionicons name="person" size={28} color={theme.actionButton} />
				</View>
				<Text style={[innerStyles.title, { color: theme.text }]}>Profile</Text>
				<Text style={[innerStyles.subtitle, { color: theme.textTertiary }]}>Set up your profile info</Text>
			</View>
			<Pressable
				style={({ pressed }) => [innerStyles.button, { backgroundColor: pressed ? theme.actionButtonPressed : theme.actionButton }]}
				onPress={() => navigation.push("step2")}
			>
				<Text style={[innerStyles.buttonText, { color: theme.actionButtonText }]}>Next</Text>
			</Pressable>
		</View>
	);
}

function Step2({ navigation }: Props) {
	const theme = useTheme();

	return (
		<View style={[innerStyles.screen, { backgroundColor: theme.surface }]}>
			<View style={innerStyles.header}>
				<Pressable onPress={() => navigation.goBack()} hitSlop={8}>
					<Ionicons name="arrow-back" size={20} color={theme.text} />
				</Pressable>
				<Text style={[innerStyles.stepLabel, { color: theme.textTertiary }]}>Step 2 of 3</Text>
				<View style={{ width: 20 }} />
			</View>
			<View style={innerStyles.body}>
				<View
					style={[innerStyles.icon, { backgroundColor: theme.actionButton + "33" }]}
				>
					<Ionicons name="notifications" size={28} color={theme.actionButton} />
				</View>
				<Text style={[innerStyles.title, { color: theme.text }]}>Notifications</Text>
				<Text style={[innerStyles.subtitle, { color: theme.textTertiary }]}>Choose your preferences</Text>
			</View>
			<Pressable
				style={({ pressed }) => [innerStyles.button, { backgroundColor: pressed ? theme.actionButtonPressed : theme.actionButton }]}
				onPress={() => navigation.push("step3")}
			>
				<Text style={[innerStyles.buttonText, { color: theme.actionButtonText }]}>Next</Text>
			</Pressable>
		</View>
	);
}

function Step3({ navigation }: Props) {
	const theme = useTheme();

	return (
		<View style={[innerStyles.screen, { backgroundColor: theme.surface }]}>
			<View style={innerStyles.header}>
				<Pressable onPress={() => navigation.goBack()} hitSlop={8}>
					<Ionicons name="arrow-back" size={20} color={theme.text} />
				</Pressable>
				<Text style={[innerStyles.stepLabel, { color: theme.textTertiary }]}>Step 3 of 3</Text>
				<View style={{ width: 20 }} />
			</View>
			<View style={innerStyles.body}>
				<Ionicons name="checkmark-circle" size={48} color={theme.actionButton} />
				<Text style={[innerStyles.title, { color: theme.text }]}>Done!</Text>
				<Text style={[innerStyles.subtitle, { color: theme.textTertiary }]}>You're all set</Text>
			</View>
			<Pressable
				style={({ pressed }) => [innerStyles.button, { backgroundColor: pressed ? theme.actionButtonPressed : theme.actionButton }]}
				onPress={() => navigation.popToTop()}
			>
				<Text style={[innerStyles.buttonText, { color: theme.actionButtonText }]}>Restart</Text>
			</Pressable>
		</View>
	);
}

// --- Outer blank-stack screen ---

export default function EmbeddedFlowDemo() {
	const theme = useTheme();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={["top"]}>
			<ScreenHeader
				title="Embedded Flow"
				subtitle="Component stack inside a blank-stack screen"
			/>

			<View style={styles.content}>
				<View style={[styles.infoBox, { backgroundColor: theme.infoBox }]}>
					<Text style={[styles.infoTitle, { color: theme.infoBoxLabel }]}>What is this?</Text>
					<Text style={[styles.infoText, { color: theme.textSecondary }]}>
						The card below is a self-contained component stack using{" "}
						<Text style={[styles.highlight, { color: theme.text }]}>react-native-screens</Text> under the
						hood. Navigate within it — the outer screen stays untouched.
					</Text>
				</View>

				<View style={[styles.flowCard, { backgroundColor: theme.surface }]}>
					<Flow.Navigator initialRouteName="step1">
						<Flow.Screen
							name="step1"
							component={Step1}
							options={{ gestureEnabled: false }}
						/>
						<Flow.Screen
							name="step2"
							component={Step2}
							options={{
								screenStyleInterpolator: slideFromRight,
								transitionSpec,
								gestureEnabled: true,
								gestureDirection: "horizontal",
							}}
						/>
						<Flow.Screen
							name="step3"
							component={Step3}
							options={{
								screenStyleInterpolator: slideFromRight,
								transitionSpec,
								gestureEnabled: true,
								gestureDirection: "horizontal",
							}}
						/>
					</Flow.Navigator>
				</View>

				<View style={[styles.noteBox, { backgroundColor: theme.noteBox }]}>
					<Text style={[styles.noteText, { color: theme.noteText }]}>
						Swipe down on the outer screen to dismiss back to the index. The
						embedded flow is fully isolated.
					</Text>
				</View>
			</View>
		</SafeAreaView>
	);
}

// --- Outer screen styles ---

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
		fontWeight: "600",
		marginBottom: 6,
	},
	infoText: {
		fontSize: 13,
		lineHeight: 19,
	},
	highlight: {
		fontWeight: "600",
	},
	flowCard: {
		flex: 1,
		borderRadius: 14,
		overflow: "hidden",
	},
	noteBox: {
		borderRadius: 14,
		padding: 12,
	},
	noteText: {
		fontSize: 12,
		lineHeight: 17,
	},
});

// --- Inner flow screen styles ---

const innerStyles = StyleSheet.create({
	screen: {
		flex: 1,
		padding: 16,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	stepLabel: {
		fontSize: 13,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	body: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
	},
	icon: {
		width: 56,
		height: 56,
		borderRadius: 28,
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		fontSize: 22,
		fontWeight: "700",
	},
	subtitle: {
		fontSize: 14,
	},
	button: {
		paddingVertical: 14,
		borderRadius: 999,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 15,
		fontWeight: "600",
	},
});
