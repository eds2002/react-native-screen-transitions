import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition, {
	type ScreenTransitionConfig,
	type TransitionClipPresentation,
} from "react-native-screen-transitions";

const PUBLIC_CLIP_STYLE_ID = "maestro-smooth-clip-public-slot";
const BOUNDARY_CLIP_ID = "maestro-smooth-clip-boundary-slot";

const PUBLIC_MAXIMUM_SIZE = { width: 240, height: 112 } as const;
const BOUNDARY_MAXIMUM_SIZE = { width: 240, height: 130 } as const;

const PUBLIC_BASE_CLIP: TransitionClipPresentation = {
	clip: {
		x: 0,
		y: 0,
		width: PUBLIC_MAXIMUM_SIZE.width,
		height: PUBLIC_MAXIMUM_SIZE.height,
		radius: 28,
		topRightRadius: 12,
		bottomLeftRadius: 38,
		curve: "continuous",
	},
	contentTranslateX: 0,
	contentTranslateY: 0,
	contentScale: 1,
};

const SOURCE_BOUNDARY_BASE_CLIP: TransitionClipPresentation = {
	clip: {
		x: 12,
		y: 12,
		width: 150,
		height: 82,
		radius: 24,
		topLeftRadius: 36,
		bottomRightRadius: 10,
		curve: "continuous",
	},
	contentTranslateX: -10,
	contentTranslateY: -7,
	contentScale: 0.92,
};

const DESTINATION_BOUNDARY_BASE_CLIP: TransitionClipPresentation = {
	clip: {
		x: 0,
		y: 0,
		width: BOUNDARY_MAXIMUM_SIZE.width,
		height: BOUNDARY_MAXIMUM_SIZE.height,
		radius: 34,
		curve: "continuous",
	},
	contentTranslateX: 0,
	contentTranslateY: 0,
	contentScale: 1,
};

export const smoothClipOptions: ScreenTransitionConfig = {
	gestureEnabled: true,
	gestureDirection: "vertical",
	navigationMaskEnabled: true,
	screenStyleInterpolator: ({ active, bounds, progress }) => {
		"worklet";
		const visualProgress = Math.max(0, Math.min(1, progress));
		const publicClip: TransitionClipPresentation = {
			clip: {
				x: interpolate(visualProgress, [0, 1], [34, 0], "clamp"),
				y: interpolate(visualProgress, [0, 1], [22, 0], "clamp"),
				width: interpolate(
					visualProgress,
					[0, 1],
					[172, PUBLIC_MAXIMUM_SIZE.width],
					"clamp",
				),
				height: interpolate(
					visualProgress,
					[0, 1],
					[68, PUBLIC_MAXIMUM_SIZE.height],
					"clamp",
				),
				radius: interpolate(visualProgress, [0, 1], [44, 28], "clamp"),
				topRightRadius: interpolate(visualProgress, [0, 1], [8, 12], "clamp"),
				bottomLeftRadius: interpolate(
					visualProgress,
					[0, 1],
					[16, 38],
					"clamp",
				),
				curve: "continuous",
			},
			contentTranslateX: interpolate(visualProgress, [0, 1], [-18, 0], "clamp"),
			contentTranslateY: interpolate(visualProgress, [0, 1], [-10, 0], "clamp"),
			contentScale: interpolate(visualProgress, [0, 1], [0.82, 1], "clamp"),
		};

		return {
			...bounds({ id: BOUNDARY_CLIP_ID }).navigation.zoom({
				borderRadius: 34,
				keepFocusedVisible: true,
				target: "bound",
			}),
			[PUBLIC_CLIP_STYLE_ID]: {
				clip: publicClip,
				style: {
					opacity: interpolate(
						active.transitionProgress,
						[0, 0.35, 1],
						[0.35, 0.72, 1],
						"clamp",
					),
				},
			},
		};
	},
	transitionSpec: Transition.Specs.Zoom,
};

function FixtureButton({
	testID,
	label,
	onPress,
}: {
	testID: string;
	label: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			testID={testID}
			onPress={onPress}
			style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
		>
			<Text style={styles.buttonText}>{label}</Text>
		</Pressable>
	);
}

function PublicClipCard({
	destination = false,
	onTouch,
}: {
	destination?: boolean;
	onTouch?: () => void;
}) {
	return (
		<Transition.ClipView
			accessibilityLabel="Interactive public clip host"
			accessible
			clip={PUBLIC_BASE_CLIP}
			contentStyle={styles.clipContent}
			hostStyle={styles.publicClipHost}
			maximumSize={PUBLIC_MAXIMUM_SIZE}
			styleId={PUBLIC_CLIP_STYLE_ID}
			testID={
				destination
					? "maestro-smooth-clip-public-detail"
					: "maestro-smooth-clip-public"
			}
		>
			<Pressable onPress={onTouch} style={styles.clipPressable}>
				<Text style={styles.clipTitle}>public ClipView</Text>
				<Text style={styles.clipCaption}>mixed clip + opacity slot</Text>
			</Pressable>
		</Transition.ClipView>
	);
}

function BoundaryClipCard({
	destination = false,
	onTouch,
}: {
	destination?: boolean;
	onTouch?: () => void;
}) {
	return (
		<Transition.Boundary.ClipView
			accessibilityLabel="Interactive boundary clip host"
			accessible
			clip={
				destination ? DESTINATION_BOUNDARY_BASE_CLIP : SOURCE_BOUNDARY_BASE_CLIP
			}
			contentStyle={styles.clipContent}
			escapeClipping
			handoff
			hostStyle={styles.boundaryClipHost}
			id={BOUNDARY_CLIP_ID}
			maximumSize={BOUNDARY_MAXIMUM_SIZE}
			testID={
				destination
					? "maestro-smooth-clip-boundary-detail"
					: "maestro-smooth-clip-boundary"
			}
		>
			<Pressable onPress={onTouch} style={styles.clipPressable}>
				<Text style={styles.clipTitle}>Boundary.ClipView</Text>
				<Text style={styles.clipCaption}>handoff + escape host unit</Text>
			</Pressable>
		</Transition.Boundary.ClipView>
	);
}

export function SmoothClipFixture() {
	const [compact, setCompact] = useState(false);
	const [publicTouches, setPublicTouches] = useState(0);
	const [boundaryTouches, setBoundaryTouches] = useState(0);

	return (
		<SafeAreaView testID="maestro-smooth-clip-host" style={styles.screen}>
			<View style={styles.header}>
				<Text style={styles.kicker}>SmoothClip v4 fixture</Text>
				<Text style={styles.title}>Clip source</Text>
				<Text testID="maestro-smooth-clip-layout-state" style={styles.probe}>
					{compact ? "clip-layout:compact" : "clip-layout:regular"}
				</Text>
				<Text testID="maestro-smooth-clip-touch-state" style={styles.probe}>
					{`clip-touches:${publicTouches};boundary-touches:${boundaryTouches}`}
				</Text>
			</View>
			<View style={styles.actions}>
				<FixtureButton
					testID="maestro-smooth-clip-open-detail"
					label="Open clipped detail"
					onPress={() => router.push("/maestro/smooth-clip-detail")}
				/>
				<FixtureButton
					testID="maestro-smooth-clip-toggle-layout"
					label="Relayout clip hosts"
					onPress={() => setCompact((value) => !value)}
				/>
			</View>
			<View style={[styles.clipStack, compact && styles.clipStackCompact]}>
				<PublicClipCard
					onTouch={() => setPublicTouches((value) => value + 1)}
				/>
				<BoundaryClipCard
					onTouch={() => setBoundaryTouches((value) => value + 1)}
				/>
			</View>
		</SafeAreaView>
	);
}

export function SmoothClipDetailFixture() {
	return (
		<SafeAreaView testID="maestro-smooth-clip-detail" style={styles.screen}>
			<View style={styles.header}>
				<Text style={styles.kicker}>SmoothClip v4 fixture</Text>
				<Text style={styles.title}>Clip destination</Text>
			</View>
			<View style={[styles.clipStack, styles.destinationClipStack]}>
				<PublicClipCard destination />
				<BoundaryClipCard destination />
			</View>
			<FixtureButton
				testID="maestro-smooth-clip-close-detail"
				label="Close clipped detail"
				onPress={() => router.back()}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	actions: {
		flexDirection: "row",
		gap: 10,
	},
	boundaryClipHost: {
		backgroundColor: "#6d28d9",
	},
	button: {
		alignItems: "center",
		backgroundColor: "#2563eb",
		borderRadius: 12,
		flex: 1,
		justifyContent: "center",
		minHeight: 48,
		paddingHorizontal: 12,
	},
	buttonPressed: {
		opacity: 0.7,
	},
	buttonText: {
		color: "white",
		fontSize: 13,
		fontWeight: "800",
		textAlign: "center",
	},
	clipCaption: {
		color: "rgba(255,255,255,0.72)",
		fontSize: 12,
		fontWeight: "600",
	},
	clipContent: {
		alignItems: "center",
		justifyContent: "center",
	},
	clipPressable: {
		alignItems: "center",
		height: "100%",
		justifyContent: "center",
		width: "100%",
	},
	clipStack: {
		alignItems: "flex-start",
		flex: 1,
		gap: 12,
		justifyContent: "center",
	},
	clipStackCompact: {
		alignItems: "flex-end",
		justifyContent: "flex-start",
	},
	clipTitle: {
		color: "white",
		fontSize: 17,
		fontWeight: "900",
	},
	destinationClipStack: {
		alignItems: "center",
	},
	header: {
		gap: 6,
	},
	kicker: {
		color: "#7dd3fc",
		fontSize: 12,
		fontWeight: "900",
		textTransform: "uppercase",
	},
	probe: {
		alignSelf: "flex-start",
		color: "#d1e9ff",
		fontSize: 12,
		fontWeight: "800",
	},
	publicClipHost: {
		backgroundColor: "#0f766e",
	},
	screen: {
		backgroundColor: "#10141f",
		flex: 1,
		gap: 12,
		paddingHorizontal: 20,
		paddingBottom: 18,
	},
	title: {
		color: "white",
		fontSize: 26,
		fontWeight: "900",
	},
});
