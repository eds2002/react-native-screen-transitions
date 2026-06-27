import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition, { TRANSFORM_RESET } from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { IOSSlide } from "@/lib/screen-transitions/ios-slide";
import { ALL_CASES, activeCaseId, BOUNDARY_TAG } from "./constants";
import { OPENING_TRANSFORM_BOUNDARY_ID } from "./opening-transform/constants";

const resolveActiveCase = () => {
	"worklet";
	const id = activeCaseId.value;
	for (let i = 0; i < ALL_CASES.length; i++) {
		if (ALL_CASES[i].id === id) {
			return ALL_CASES[i];
		}
	}
	return ALL_CASES[0];
};

const syncInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] = ({
	bounds,
	progress,
	focused,
}) => {
	"worklet";

	const testCase = resolveActiveCase();
	const destinationBoundary = testCase.destination.boundary;
	const activeStyleOptions = {
		id: BOUNDARY_TAG,
	};

	if (destinationBoundary?.method === "content") {
		if (focused) {
			const contentStyles = bounds(activeStyleOptions).styles() as Record<
				string,
				any
			>;

			return {
				content: {
					style: {
						...contentStyles,
						borderWidth: 3,
						borderColor: "red",
						borderStyle: "dashed",
					},
				},
				backdrop: {
					style: {
						backgroundColor: "black",
						opacity: interpolate(progress, [0, 1], [0, 0.5]),
					},
				},
			};
		}

		const elementStyle = bounds(activeStyleOptions).styles() as Record<
			string,
			any
		>;

		return {
			[BOUNDARY_TAG]: {
				...elementStyle,
				opacity: focused
					? interpolate(progress, [0, 1], [0, 1], "clamp")
					: interpolate(progress, [1, 2], [1, 0], "clamp"),
			},
		};
	}

	const elementStyle = bounds(activeStyleOptions).styles() as Record<
		string,
		any
	>;

	return {
		[BOUNDARY_TAG]: {
			...elementStyle,
			opacity: focused
				? interpolate(progress, [0, 1], [0, 1], "clamp")
				: interpolate(progress, [1, 2], [1, 0], "clamp"),
		},
	};
};

const RETARGET_ID = "retarget";

const openingTransformInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ progress, bounds, layouts, focused }) => {
		"worklet";

		const screenTranslateY = interpolate(
			progress,
			[0, 1],
			[layouts.screen.height, 0],
			"clamp",
		);
		const screenScale = interpolate(progress, [0, 1], [0.1, 1], "clamp");

		const boundStyles = bounds(OPENING_TRANSFORM_BOUNDARY_ID).styles({
			motion: ({ current, progress: motionProgress, start, props }) => {
				"worklet";
				// Half-orbit: apogee peaks mid-flight while the lateral swing runs a
				// full sine cycle — out, crossing the travel line exactly at apogee
				// (smallest, deepest), returning from the other side. The crossing is
				// what reads as "around", not "bent".
				const apogee = Math.sin(motionProgress * Math.PI);
				// -1 at the left screen edge, +1 at the right: which way to orbit.
				const screenBias =
					((start.pageX + start.width / 2) / props.layouts.screen.width) * 2 -
					1;
				const side = screenBias < 0 ? -1 : 1;
				const swingX = Math.sin(motionProgress * Math.PI * 2) * 110 * side;
				const liftY = -apogee * 48;
				const depthScale = 1 - apogee * 0.6;

				return {
					x: current.x + swingX,
					y: current.y - screenTranslateY + liftY,
					scale: current.scale * depthScale,
					// Full end-over-end flip across the flight — 360° lands upright,
					// and reversing the gesture unwinds it. Yaw into the orbit
					// direction with a slight banking roll while it carves the turn.
					rotateX: motionProgress * 360,
					rotateY: side * apogee * -40 + screenBias * 12,
					rotate: side * apogee * -6,
					perspective: 650,
				};
			},
		}) as any;

		return {
			content: {
				style: {
					transform: [
						{ translateY: screenTranslateY },
						{ scale: !focused ? 1 : screenScale },
					],
				},
			},
			[OPENING_TRANSFORM_BOUNDARY_ID]: boundStyles,
		};
	};

const retargetInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, progress, focused, active }) => {
		"worklet";

		const elementStyle = bounds(RETARGET_ID).styles() as Record<string, any>;

		if (active.settled) {
			return {
				[RETARGET_ID]: {
					...TRANSFORM_RESET,
					opacity: focused
						? interpolate(progress, [0, 1], [0, 1], "clamp")
						: interpolate(progress, [1, 2], [1, 0.5], "clamp"),
				},
			};
		}

		return {
			[RETARGET_ID]: {
				...elementStyle,
				opacity: focused
					? interpolate(progress, [0, 1], [0, 1], "clamp")
					: interpolate(progress, [1, 2], [1, 0.5], "clamp"),
			},
		};
	};

export default function BoundsSyncLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="source"
				// options={{
				// 	...IOSSlide(),
				// }}
			/>
			<StackNavigator.Screen
				name="destination"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical-inverted", "vertical"],
					screenStyleInterpolator: syncInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<StackNavigator.Screen
				name="retarget/index"
				options={{
					...IOSSlide(),
				}}
			/>
			<StackNavigator.Screen
				name="retarget/[id]"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical-inverted", "vertical"],
					screenStyleInterpolator: retargetInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<StackNavigator.Screen
				name="opening-transform/index"
				options={{
					...IOSSlide(),
				}}
			/>
			<StackNavigator.Screen
				name="opening-transform/destination"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted"],
					screenStyleInterpolator: openingTransformInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
