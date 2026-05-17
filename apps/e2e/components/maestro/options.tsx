import { BlurView } from "expo-blur";
import { Text, View } from "react-native";
import { interpolate, makeMutable } from "react-native-reanimated";
import type {
	OverlayProps,
	ScreenTransitionConfig,
	SnapPoint,
} from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";

const TRANSITION_SPEC = {
	open: Transition.Specs.DefaultSpec,
	close: Transition.Specs.DefaultSpec,
};

const GESTURE_RESISTANCE = 0.42;

export const activeMaestroBoundId = makeMutable("a");

export function slideOptions(
	direction: "horizontal" | "horizontal-inverted" | "vertical" | "vertical-inverted",
	config: Partial<ScreenTransitionConfig> = {},
): ScreenTransitionConfig {
	const isHorizontal =
		direction === "horizontal" || direction === "horizontal-inverted";
	const inverted =
		direction === "horizontal-inverted" || direction === "vertical-inverted";

	return {
		enableTransitions: true,
		gestureEnabled: true,
		gestureDirection: direction,
		screenStyleInterpolator: ({
			progress,
			layouts: {
				screen: { width, height },
			},
		}) => {
			"worklet";
			const distance = isHorizontal ? width : height;
			const enter = inverted ? -distance : distance;
			const exit = inverted ? distance * 0.22 : -distance * 0.22;
			const translate = interpolate(
				progress,
				[0, 1, 2],
				[enter, 0, exit],
				"clamp",
			);

			return {
				content: {
					style: {
						transform: isHorizontal
							? [{ translateX: translate }]
							: [{ translateY: translate }],
					},
				},
			};
		},
		transitionSpec: TRANSITION_SPEC,
		...config,
	};
}

export function pinchOptions(
	direction: "pinch-in" | "pinch-out",
): ScreenTransitionConfig {
	return {
		enableTransitions: true,
		gestureEnabled: true,
		gestureDirection: direction,
		screenStyleInterpolator: ({ progress }) => {
			"worklet";
			const scale = interpolate(
				progress,
				[0, 1, 2],
				direction === "pinch-in" ? [0.72, 1, 1.08] : [1.28, 1, 0.78],
				"clamp",
			);

			return {
				content: {
					style: {
						opacity: interpolate(progress, [0, 1], [0, 1], "clamp"),
						transform: [{ scale }],
					},
				},
			};
		},
		transitionSpec: TRANSITION_SPEC,
	};
}

export function sheetOptions({
	direction = "vertical",
	snapPoints = [0.5, 1],
	initialSnapIndex = 0,
	backdropBehavior,
	customBackdrop = false,
	gestureSnapLocked,
	sheetScrollGestureBehavior,
	gestureDirection,
}: {
	direction?: "vertical" | "vertical-inverted" | "horizontal" | "horizontal-inverted";
	snapPoints?: SnapPoint[];
	initialSnapIndex?: number;
	backdropBehavior?: ScreenTransitionConfig["backdropBehavior"];
	customBackdrop?: boolean;
	gestureSnapLocked?: boolean;
	sheetScrollGestureBehavior?: ScreenTransitionConfig["sheetScrollGestureBehavior"];
	gestureDirection?: ScreenTransitionConfig["gestureDirection"];
} = {}): ScreenTransitionConfig {
	const isHorizontal =
		direction === "horizontal" || direction === "horizontal-inverted";
	const inverted =
		direction === "horizontal-inverted" || direction === "vertical-inverted";

	return {
		enableTransitions: true,
		gestureEnabled: true,
		gestureDirection: gestureDirection ?? direction,
		snapPoints,
		initialSnapIndex,
		backdropBehavior,
		backdropComponent: customBackdrop ? BlurView : undefined,
		gestureSnapLocked,
		sheetScrollGestureBehavior,
		screenStyleInterpolator: ({
			progress,
			layouts: {
				screen: { width, height },
			},
		}) => {
			"worklet";
			const distance = isHorizontal ? width : height;
			const sign = inverted ? -1 : 1;
			const translate = sign * distance * (1 - progress);

			return {
				backdrop: customBackdrop
					? {
							props: {
								intensity: interpolate(progress, [0, 1], [0, 70], "clamp"),
							},
						}
					: undefined,
				content: {
					style: {
						transform: isHorizontal
							? [{ translateX: translate }]
							: [{ translateY: translate }],
					},
				},
			};
		},
		transitionSpec: TRANSITION_SPEC,
	};
}

export const multiAxisSnapOptions: ScreenTransitionConfig = {
	enableTransitions: true,
	gestureEnabled: true,
	gestureDirection: ["horizontal", "vertical-inverted"],
	gestureReleaseVelocityScale: 0,
	snapPoints: [0.45, 0.75, 1],
	initialSnapIndex: 1,
	screenStyleInterpolator: ({
		current,
		progress,
		layouts: {
			screen: { width },
		},
	}) => {
		"worklet";
		const baseTranslateX = interpolate(progress, [0, 1], [width, 0], "clamp");
		const translateX = baseTranslateX + current.gesture.x * GESTURE_RESISTANCE;
		const translateY = current.gesture.y * GESTURE_RESISTANCE;
		const scale = interpolate(progress, [0, 1, 2], [0.96, 1, 0.96], "clamp");

		return {
			content: {
				style: {
					opacity: interpolate(progress, [0, 1], [0, 1], "clamp"),
					transform: [{ translateX }, { translateY }, { scale }],
				},
			},
		};
	},
	transitionSpec: TRANSITION_SPEC,
};

export const boundsOptions: ScreenTransitionConfig = {
	enableTransitions: true,
	gestureEnabled: true,
	gestureDirection: ["vertical", "vertical-inverted"],
	screenStyleInterpolator: ({ bounds, progress, focused }) => {
		"worklet";
		const id = `maestro-bound-${activeMaestroBoundId.value}`;
		const boundStyles = bounds({ id }) as Record<string, unknown>;

		return {
			[id]: {
				...boundStyles,
				opacity: focused
					? interpolate(progress, [0, 1], [0, 1], "clamp")
					: interpolate(progress, [1, 2], [1, 0], "clamp"),
			},
		};
	},
	transitionSpec: TRANSITION_SPEC,
};

export function MaestroOverlay({
	focusedRoute,
	focusedIndex,
	navigation,
}: OverlayProps) {
	const canGoBack = focusedIndex > 0;
	const nav = navigation as { goBack: () => void };

	return (
		<View
			testID="maestro-overlay-bar"
			style={{
				position: "absolute",
				left: 18,
				right: 18,
				bottom: 28,
				borderRadius: 18,
				backgroundColor: "rgba(12, 18, 28, 0.92)",
				padding: 12,
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
			}}
			pointerEvents="box-none"
		>
			<Text
				testID="maestro-overlay-route"
				style={{ color: "white", fontSize: 13, fontWeight: "800" }}
			>
				overlay-route:{focusedRoute.name}
			</Text>
			<Text
				testID="maestro-overlay-back"
				onPress={() => canGoBack && nav.goBack()}
				style={{
					color: canGoBack ? "#8bd3ff" : "rgba(255,255,255,0.35)",
					fontSize: 13,
					fontWeight: "800",
					padding: 6,
				}}
			>
				back
			</Text>
		</View>
	);
}
