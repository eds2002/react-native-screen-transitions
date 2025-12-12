import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { type Href, router } from "expo-router";
import {
	KeyboardAvoidingView,
	Pressable,
	StyleSheet,
	View,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BlankStackOverlayProps } from "react-native-screen-transitions/blank-stack";
import { ComposableText } from "@/components/composeable-text";
import {
	BlankStack,
	defaultScreenOptions,
	verticalScreenOptions,
} from "@/components/layouts/blank-stack";

const TOTAL_STEPS = 3;

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

const OnboardingOverlay = (props: BlankStackOverlayProps) => {
	const content = props.meta as OnboardingOverlayOptions;
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
				<View style={styles.topBar}>
					<Pressable style={styles.iconWrapper} onPress={router.back}>
						<FontAwesome6 name="chevron-left" size={16} color="black" />
					</Pressable>

					<View style={styles.progressContainer}>
						{Array.from({ length: TOTAL_STEPS }).map((_, index) => (
							<ProgressPill
								key={index.toString()}
								animation={props.overlayAnimation}
								index={index}
							/>
						))}
					</View>

					<View style={styles.iconWrapper} />
				</View>

				<Pressable style={styles.primaryButton} onPress={onHandlePress}>
					<ComposableText
						text={content.buttonText ?? ""}
						style={styles.primaryButtonText}
					/>
				</Pressable>
			</KeyboardAvoidingView>
		</View>
	);
};

export default function OnboardingLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen
				name="index"
				options={{
					overlay: OnboardingOverlay,
					overlayMode: "float",
					overlayShown: true,
					meta: {
						buttonText: "Set my username",
						next: "/onboarding/b",
					},
				}}
			/>
			<BlankStack.Screen
				name="b"
				options={{
					meta: {
						buttonText: "Set my nickname",
						next: "/onboarding/c",
					},
					...defaultScreenOptions,
				}}
			/>
			<BlankStack.Screen
				name="c"
				options={{
					meta: {
						buttonText: "All set",
						next: "/onboarding/nested/a",
					},
					...defaultScreenOptions,
				}}
			/>
			<BlankStack.Screen
				name="nested"
				options={{
					meta: {
						buttonText: "NESTED HOLY MOLY",
						next: "/onboarding/nested/a",
					},
					...verticalScreenOptions,
				}}
			/>
		</BlankStack>
	);
}

const styles = StyleSheet.create({
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
	primaryButton: {
		padding: 16,
		borderRadius: 99,
		backgroundColor: "#e11d48",
		alignItems: "center",
		justifyContent: "center",
	},
	primaryButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "600",
	},
});
