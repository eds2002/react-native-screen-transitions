import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ScreenInterpolationProps } from "react-native-screen-transitions";
import type { ComponentStackScreenProps } from "react-native-screen-transitions/component-stack";
import { createComponentStackNavigator } from "react-native-screen-transitions/component-stack";
import { ScreenHeader } from "@/components/screen-header";

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
	return (
		<View style={innerStyles.screen}>
			<View style={innerStyles.header}>
				<Text style={innerStyles.stepLabel}>Step 1 of 3</Text>
			</View>
			<View style={innerStyles.body}>
				<View
					style={[innerStyles.icon, { backgroundColor: "rgba(88,86,214,0.2)" }]}
				>
					<Ionicons name="person" size={28} color="#5856D6" />
				</View>
				<Text style={innerStyles.title}>Profile</Text>
				<Text style={innerStyles.subtitle}>Set up your profile info</Text>
			</View>
			<Pressable
				style={innerStyles.button}
				onPress={() => navigation.push("step2")}
			>
				<Text style={innerStyles.buttonText}>Next</Text>
			</Pressable>
		</View>
	);
}

function Step2({ navigation }: Props) {
	return (
		<View style={innerStyles.screen}>
			<View style={innerStyles.header}>
				<Pressable onPress={() => navigation.goBack()} hitSlop={8}>
					<Ionicons name="arrow-back" size={20} color="#fff" />
				</Pressable>
				<Text style={innerStyles.stepLabel}>Step 2 of 3</Text>
				<View style={{ width: 20 }} />
			</View>
			<View style={innerStyles.body}>
				<View
					style={[innerStyles.icon, { backgroundColor: "rgba(52,199,89,0.2)" }]}
				>
					<Ionicons name="notifications" size={28} color="#34C759" />
				</View>
				<Text style={innerStyles.title}>Notifications</Text>
				<Text style={innerStyles.subtitle}>Choose your preferences</Text>
			</View>
			<Pressable
				style={innerStyles.button}
				onPress={() => navigation.push("step3")}
			>
				<Text style={innerStyles.buttonText}>Next</Text>
			</Pressable>
		</View>
	);
}

function Step3({ navigation }: Props) {
	return (
		<View style={innerStyles.screen}>
			<View style={innerStyles.header}>
				<Pressable onPress={() => navigation.goBack()} hitSlop={8}>
					<Ionicons name="arrow-back" size={20} color="#fff" />
				</Pressable>
				<Text style={innerStyles.stepLabel}>Step 3 of 3</Text>
				<View style={{ width: 20 }} />
			</View>
			<View style={innerStyles.body}>
				<Ionicons name="checkmark-circle" size={48} color="#34C759" />
				<Text style={innerStyles.title}>Done!</Text>
				<Text style={innerStyles.subtitle}>You're all set</Text>
			</View>
			<Pressable
				style={innerStyles.button}
				onPress={() => navigation.popToTop()}
			>
				<Text style={innerStyles.buttonText}>Restart</Text>
			</Pressable>
		</View>
	);
}

// --- Outer blank-stack screen ---

export default function EmbeddedFlowDemo() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Embedded Flow"
				subtitle="Component stack inside a blank-stack screen"
			/>

			<View style={styles.content}>
				<View style={styles.infoBox}>
					<Text style={styles.infoTitle}>What is this?</Text>
					<Text style={styles.infoText}>
						The card below is a self-contained component stack using{" "}
						<Text style={styles.highlight}>react-native-screens</Text> under the
						hood. Navigate within it — the outer screen stays untouched.
					</Text>
				</View>

				<View style={styles.flowCard}>
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

				<View style={styles.noteBox}>
					<Text style={styles.noteText}>
						Swipe ↓ on the outer screen to dismiss back to the index. The
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
		backgroundColor: "#1a1a2e",
	},
	content: {
		flex: 1,
		padding: 16,
		gap: 16,
	},
	infoBox: {
		backgroundColor: "rgba(88, 86, 214, 0.1)",
		borderRadius: 12,
		padding: 14,
		borderWidth: 1,
		borderColor: "rgba(88, 86, 214, 0.3)",
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#5856D6",
		marginBottom: 6,
	},
	infoText: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.7)",
		lineHeight: 19,
	},
	highlight: {
		color: "#5856D6",
		fontWeight: "600",
	},
	flowCard: {
		flex: 1,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "rgba(88, 86, 214, 0.4)",
		overflow: "hidden",
		backgroundColor: "#1e1e2e",
	},
	noteBox: {
		backgroundColor: "rgba(255, 193, 7, 0.1)",
		borderRadius: 10,
		padding: 12,
		borderWidth: 1,
		borderColor: "rgba(255, 193, 7, 0.3)",
	},
	noteText: {
		fontSize: 12,
		color: "#ffc107",
		lineHeight: 17,
	},
});

// --- Inner flow screen styles ---

const innerStyles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: "#1e1e2e",
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
		color: "#888",
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
		color: "#fff",
	},
	subtitle: {
		fontSize: 14,
		color: "#888",
	},
	button: {
		backgroundColor: "#5856D6",
		paddingVertical: 14,
		borderRadius: 10,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#fff",
	},
});
