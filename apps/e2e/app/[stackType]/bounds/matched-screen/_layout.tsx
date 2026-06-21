import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import {
	MATCHED_SCREEN_LEG_ID,
	MATCHED_SCREEN_SICK_ID,
	MATCHED_SCREEN_SUBWAY_ID,
	MATCHED_SCREEN_YOUNGBOY_ID,
} from "./constants";

const matchedScreenInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, focused, active, progress }) => {
		"worklet";

		const youngboyStyle = bounds(MATCHED_SCREEN_YOUNGBOY_ID).styles({
			method: "size",
			motion: ({ current, progress: motionProgress, start, props }) => {
				"worklet";
				const envelope = Math.sin(motionProgress * Math.PI);
				const screenCenter = props.layouts.screen.width / 2;
				const side = start.pageX + start.width / 2 < screenCenter ? -1 : 1;
				const sweep = Math.sin(motionProgress * Math.PI * 2);

				return {
					x: current.x + side * sweep * envelope * 48,
					y: current.y - envelope * 64,
					scale: current.scale * (1 + envelope * 0.08),
					rotate: side * envelope * 8,
					rotateX: envelope * 12,
					rotateY: side * envelope * -10,
					perspective: 700,
				};
			},
		}) as Record<string, any>;
		const subwayStyle = bounds(MATCHED_SCREEN_SUBWAY_ID).styles({
			motion: ({ current, progress: motionProgress }) => {
				"worklet";
				const envelope = Math.sin(motionProgress * Math.PI);
				const sweep = Math.sin(motionProgress * Math.PI * 2);

				return {
					x: current.x - sweep * envelope * 36,
					y: current.y + envelope * 56,
					scale: current.scale * (1 - envelope * 0.07),
					rotate: envelope * -7,
					rotateX: envelope * -10,
					rotateY: envelope * 8,
					perspective: 700,
				};
			},
		}) as Record<string, any>;
		const legStyle = bounds(MATCHED_SCREEN_LEG_ID).styles({
			motion: ({ current, progress: motionProgress }) => {
				"worklet";
				const envelope = Math.sin(motionProgress * Math.PI);
				const sway = Math.sin(motionProgress * Math.PI * 2);

				return {
					x: current.x + envelope * 42,
					y: current.y + sway * envelope * 44,
					scale: current.scale * (1 + envelope * 0.06),
					rotate: envelope * 10,
					rotateX: envelope * sway * 8,
					rotateY: envelope * -12,
					perspective: 700,
				};
			},
		}) as Record<string, any>;
		const sickStyle = bounds(MATCHED_SCREEN_SICK_ID).styles({
			motion: ({ current, progress: motionProgress, props }) => {
				"worklet";
				const envelope = Math.sin(motionProgress * Math.PI);
				const phase = motionProgress * Math.PI;
				const spiralX = Math.cos(phase * 2) * envelope;
				const spiralY = Math.sin(phase * 2) * envelope;
				const screenPush = props.layouts.screen.width * 0.1;

				return {
					x: current.x + spiralX * screenPush,
					y: current.y + spiralY * 52 - envelope * 32,
					scale: current.scale * (1 + envelope * 0.1),
					rotate: envelope * Math.sin(phase * 2) * 14,
					rotateX: envelope * -8,
					rotateY: envelope * 14,
					perspective: 700,
				};
			},
		}) as Record<string, any>;

		if (focused) {
			return {
				backdrop: {
					backgroundColor: "#000000",
					opacity: progress,
				},
			};
		}

		const borderRadius = interpolate(active.progress, [0, 1], [24, 0], "clamp");

		return {
			[MATCHED_SCREEN_YOUNGBOY_ID]: {
				...youngboyStyle,
				borderRadius,
			},
			[MATCHED_SCREEN_SUBWAY_ID]: {
				...subwayStyle,
				borderRadius,
			},
			[MATCHED_SCREEN_LEG_ID]: {
				...legStyle,
				borderRadius,
			},
			[MATCHED_SCREEN_SICK_ID]: {
				...sickStyle,
				borderRadius,
			},
		};
	};

export default function MatchedScreenLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="player"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted"],
					inactiveBehavior: "keep",
					screenStyleInterpolator: matchedScreenInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
