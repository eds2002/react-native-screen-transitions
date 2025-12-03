import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { type Href, router } from "expo-router";
import {
	KeyboardAvoidingView,
	Pressable,
	StyleSheet,
	View,
} from "react-native";
import Animated, {
	interpolate,
	useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition, {
	type ScreenStyleInterpolator,
} from "react-native-screen-transitions";
import type { BlankStackOverlayProps } from "react-native-screen-transitions/blank-stack";
import { ComposableText } from "@/components/composeable-text";
import { BlankStack } from "@/components/layouts/blank-stack";

interface ProgressPillProps {
	animation: BlankStackOverlayProps["overlayAnimation"];
	index: number;
}

const ProgressPill = ({ animation, index }: ProgressPillProps) => {
	const fillStyle = useAnimatedStyle(() => {
		"worklet";
		const total = animation.value.progress;
		const localProgress = Math.min(Math.max(total - index, 0), 1);

		return {
			flex: Math.max(localProgress, 0),
			backgroundColor: "#e11d48",
			borderRadius: 999,
		};
	});

	return (
		<Animated.View style={styles.progressPillContainer}>
			<Animated.View style={fillStyle} />
		</Animated.View>
	);
};

type OnboardingOverlayOptions = {
	buttonText: string;
	next?: Href;
};

const OverlayComponent = (props: BlankStackOverlayProps) => {
	const content = props.overlayOptions as OnboardingOverlayOptions;
	const insets = useSafeAreaInsets();

	const onHandlePress = () => {
		const next = content.next;
		if (!next) return;
		router.navigate(next);
	};

	return (
		<View
			style={[
				StyleSheet.absoluteFill,
				{
					padding: 24,
					paddingTop: insets.top + 12,
					paddingBottom: insets.bottom + 16,
					justifyContent: "flex-end",
				},
			]}
			pointerEvents="box-none"
		>
			<KeyboardAvoidingView
				style={{ flex: 1, justifyContent: "space-between" }}
				behavior="padding"
				keyboardVerticalOffset={10}
			>
				<View style={[styles.topBar]}>
					<Pressable style={styles.iconWrapper} onPress={router.back}>
						<FontAwesome6 name="chevron-left" size={16} color="black" />
					</Pressable>

					<View style={styles.progressContainer}>
						{Array.from({ length: 3 }).map((_, index) => (
							<ProgressPill
								key={index.toString()}
								animation={props.overlayAnimation}
								index={index}
							/>
						))}
					</View>

					<View style={styles.iconWrapper} />
				</View>

				<Pressable
					style={{
						padding: 16,
						borderRadius: 99,
						backgroundColor: "#e11d48",
						alignItems: "center",
						justifyContent: "center",
					}}
					onPress={onHandlePress}
				>
					<ComposableText
						text={content.buttonText ?? ""}
						style={{
							color: "white",
							fontSize: 18,
							fontWeight: "600",
						}}
					/>
				</Pressable>
			</KeyboardAvoidingView>
		</View>
	);
};

const sharedScreenInterpolator: ScreenStyleInterpolator = ({
	progress,
	layouts: { screen },
	bounds,
}) => {
	"worklet";
	const x = interpolate(progress, [0, 1, 2], [screen.width, 0, -screen.width]);
	return {
		contentStyle: {
			transform: [{ translateX: x }],
			backgroundColor: "#FFF",
		},
		["SHARED"]: bounds({ id: "SHARED" }),
	};
};

export default function OnboardingLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen
				name="index"
				options={{
					overlay: OverlayComponent,
					overlayMode: "float",
					overlayShown: true,
					overlayOptions: {
						buttonText: "Set my username",
						next: "/onboarding/b",
					},
					screenStyleInterpolator: sharedScreenInterpolator,
				}}
			/>
			<BlankStack.Screen
				name="b"
				options={{
					gestureEnabled: true,
					gestureDirection: "horizontal",
					overlayOptions: {
						buttonText: "Set my nickname",
						next: "/onboarding/c",
					},
					screenStyleInterpolator: sharedScreenInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<BlankStack.Screen
				name="c"
				options={{
					gestureEnabled: true,
					gestureDirection: "horizontal",
					overlayOptions: {
						buttonText: "All set",
						next: "/onboarding/nested-stack/",
					},
					screenStyleInterpolator: sharedScreenInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<BlankStack.Screen
				name="nested-stack"
				options={{
					gestureEnabled: true,
					overlayOptions: {
						buttonText: "All set",
						next: "/onboarding/nested-stack/",
					},
					gestureDirection: "horizontal",
					screenStyleInterpolator: sharedScreenInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</BlankStack>
	);
}

const styles = StyleSheet.create({
	headerWrapper: {
		justifyContent: "space-between",
	},
	topBar: {
		alignItems: "center",
		justifyContent: "space-between",
		height: 50,
		flexDirection: "row",
		gap: 82,
	},
	iconWrapper: {
		width: 50,
		height: 50,
		justifyContent: "center",
	},
	progressContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
		gap: 6,
	},
	progressPillContainer: {
		flex: 1,
		height: 5,
		borderRadius: 999,
		justifyContent: "flex-start",
		backgroundColor: "#ffe4e6",
		flexDirection: "row",
		overflow: "hidden",
	},
	footer: {
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
	},
	primaryButton: {
		height: 65,
		backgroundColor: "#000",
		width: "100%",
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
	},
	primaryButtonText: {
		fontSize: 20,
		fontWeight: "600",
		color: "white",
	},
});
