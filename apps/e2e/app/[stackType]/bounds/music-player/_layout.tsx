// @ts-nocheck
import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";

const toPlaylistId = (route: { params?: object }) => {
	"worklet";
	const params = route.params as Record<string, unknown> | undefined;
	const rawId = params?.id;
	return typeof rawId === "string" ? rawId : null;
};

const musicPlayerInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, current, active, progress }) => {
		"worklet";
		const currentId = toPlaylistId(current.route);
		const activeId = toPlaylistId(active.route);
		const id = currentId ?? activeId;

		if (!id) {
			return null;
		}

		const navigationStyles = bounds({
			id,
		}).navigation.zoom({ borderRadius: 48, target: "bound" });

		return {
			...navigationStyles,
			backdrop: {
				backgroundColor: "#05070B",
				opacity: interpolate(progress, [0, 1, 2], [0, 0.58, 0]),
			},
		};
	};

export default function MusicPlayerBoundsLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="[id]"
				options={{
					navigationMaskEnabled: false,
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted", "horizontal"],
					gestureReleaseVelocityScale: 1.5,
					gestureDrivesProgress: false,
					screenStyleInterpolator: musicPlayerInterpolator,
					experimental_enableHighRefreshRate: true,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.FlingSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
