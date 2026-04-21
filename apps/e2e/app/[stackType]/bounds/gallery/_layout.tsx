import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { activeGalleryId, GALLERY_GROUP } from "./constants";

const galleryZoomInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, progress, focused }) => {
		"worklet";
		const id = activeGalleryId.value;

		if (!id) {
			return {};
		}

		const zoom = bounds({
			id,
			group: GALLERY_GROUP,
		}).navigation.zoom({ target: "bound" });

		if (!focused) {
			return zoom;
		}

		return {
			...zoom,
			backdrop: {
				style: {
					backgroundColor: "#FFF",
					opacity: interpolate(progress, [0, 1], [0, 0.25], "clamp"),
				},
				props: {
					intensity: interpolate(progress, [0, 1], [0, 25], "clamp"),
				},
			},
		};
	};

export default function GalleryLayout() {
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
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted"],
					gestureReleaseVelocityScale: 1.6,
					gestureDrivesProgress: false,
					screenStyleInterpolator: galleryZoomInterpolator,
					transitionSpec: {
						open: {
							...Transition.Specs.DefaultSpec,
							mass: 2,
							overshootClamping: false,
						},
						close: {
							...Transition.Specs.DefaultSpec,
							mass: 2,
							overshootClamping: false,
						},
					},
				}}
			/>
		</StackNavigator>
	);
}
