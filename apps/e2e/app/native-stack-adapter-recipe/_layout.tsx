import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { NativeStackAdapter } from "@/layouts/native-stack-adapter";
import { PROFILE_IMAGE_BOUNDARY_ID } from "./constants";

const imageDetailInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, progress, focused }) => {
		"worklet";

		return {
			...bounds({
				id: PROFILE_IMAGE_BOUNDARY_ID,
			}).navigation.zoom({
				borderRadius: 80,
				target: "bound",
			}),
			backdrop: focused
				? {
						backgroundColor: "black",
						opacity: interpolate(progress, [0, 1, 2], [0, 0.62, 0]),
					}
				: null,
		};
	};

export default function NativeStackAdapterRecipeLayout() {
	return (
		<NativeStackAdapter>
			<NativeStackAdapter.Screen
				name="index"
				options={{
					headerShown: false,
				}}
			/>
			<NativeStackAdapter.Screen
				name="profile"
				options={{
					title: "Profile",
					headerTransparent: true,
					headerBlurEffect: "systemUltraThinMaterial",
					headerShadowVisible: false,
					headerLargeTitleEnabled: false,
				}}
			/>
			<NativeStackAdapter.Screen
				name="avatar"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: "bidirectional",
					gestureProgressMode: "freeform",
					nativeGestureEnabled: false,
					screenStyleInterpolator: imageDetailInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.FlingSpec,
					},
				}}
			/>
		</NativeStackAdapter>
	);
}
