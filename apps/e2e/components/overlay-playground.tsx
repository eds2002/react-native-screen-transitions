import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition, {
	useScreenAnimation,
} from "react-native-screen-transitions";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";

type OverlayScreenName = "A" | "B" | "C" | "D" | "E";

const nextRoute: Partial<Record<OverlayScreenName, string>> = {
	A: "overlay/second",
	B: "overlay/third",
	C: "overlay/fourth",
	D: "overlay/fifth",
};

const overlayTints: Record<"A" | "C", string> = {
	A: "#3b82f6",
	C: "#22c55e",
};

const createIOSSlideOptions = (): ScreenTransitionConfig => ({
	enableTransitions: true,
	gestureEnabled: true,
	gestureDirection: "horizontal",
	screenStyleInterpolator: ({
		progress,
		layouts: {
			screen: { width },
		},
	}) => {
		"worklet";
		const contentTranslateX = interpolate(
			progress,
			[0, 1, 2],
			[width, 0, -width * 0.3],
			"clamp",
		);
		const content = {
			style: {
				transform: [{ translateX: contentTranslateX }],
			},
		};

		return { content };
	},
	transitionSpec: {
		open: Transition.Specs.DefaultSpec,
		close: Transition.Specs.DefaultSpec,
	},
});

export const screenIOSSlideOptions = createIOSSlideOptions();

function FullScreenOverlay({ screen }: { screen: "A" | "C" }) {
	useScreenAnimation();
	return (
		<View
			pointerEvents="box-none"
			style={styles.overlay}
			testID={`overlay-playground-tint-${screen.toLowerCase()}`}
		>
			<View
				pointerEvents="none"
				style={[styles.overlayTint, { backgroundColor: overlayTints[screen] }]}
			/>
			<Text style={styles.overlayLabel}>Overlay {screen}</Text>
		</View>
	);
}

export const OverlayA = () => <FullScreenOverlay screen="A" />;
export const OverlayC = () => <FullScreenOverlay screen="C" />;

export function OverlayPlaygroundScreen({
	screen,
}: {
	screen: OverlayScreenName;
}) {
	const stackType = useResolvedStackType();
	const next = nextRoute[screen];

	return (
		<View style={styles.screen} testID={`overlay-playground-screen-${screen}`}>
			<View style={styles.content}>
				<Text style={styles.title}>Screen {screen}</Text>
				<Text style={styles.description}>
					Overlay checkpoints begin on Screen A and Screen C.
				</Text>
				{next ? (
					<Pressable
						testID={`overlay-playground-push-${screen}`}
						style={styles.button}
						onPress={() => router.push(buildStackPath(stackType, next))}
					>
						<Text style={styles.buttonText}>
							Push Screen {String.fromCharCode(screen.charCodeAt(0) + 1)}
						</Text>
					</Pressable>
				) : null}
				{screen !== "A" ? (
					<Pressable
						testID={`overlay-playground-back-${screen}`}
						style={[styles.button, styles.secondaryButton]}
						onPress={() => router.back()}
					>
						<Text style={styles.buttonText}>Back</Text>
					</Pressable>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		// Keep the canvas neutral so the initial Screen A tint is visible before
		// any navigation begins.
		backgroundColor: "#f5f7fb",
		flex: 1,
	},
	content: {
		alignItems: "center",
		flex: 1,
		gap: 16,
		justifyContent: "center",
		paddingHorizontal: 28,
	},
	title: {
		color: "#101828",
		fontSize: 36,
		fontWeight: "900",
	},
	description: {
		color: "rgba(16,24,40,0.72)",
		fontSize: 16,
		lineHeight: 24,
		maxWidth: 280,
		textAlign: "center",
	},
	button: {
		alignItems: "center",
		backgroundColor: "rgba(16,24,40,0.1)",
		borderRadius: 999,
		marginTop: 8,
		paddingHorizontal: 28,
		paddingVertical: 16,
	},
	secondaryButton: {
		backgroundColor: "rgba(16,24,40,0.18)",
	},
	buttonText: {
		color: "#101828",
		fontSize: 16,
		fontWeight: "700",
	},
	overlay: {
		alignItems: "center",
		borderColor: "red",
		borderWidth: 2,
		flex: 1,
		justifyContent: "center",
	},
	overlayTint: {
		...StyleSheet.absoluteFillObject,
		opacity: 0.25,
	},
	overlayLabel: {
		backgroundColor: "rgba(255,255,255,0.82)",
		borderRadius: 999,
		color: "#101828",
		fontSize: 24,
		fontWeight: "800",
		overflow: "hidden",
		paddingHorizontal: 20,
		paddingVertical: 10,
	},
});
