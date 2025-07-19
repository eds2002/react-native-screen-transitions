import { createStaticNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Easing, interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import Custom from "./screens/Custom";
import { GroupANavigator } from "./screens/group-a/GroupANavigator";
import { Home } from "./screens/Home";
import DeleteWarning from "./screens/mocks/delete-warning";
import GalleryModal from "./screens/mocks/gallery-modal";
import PaletteProfile from "./screens/mocks/palette-profile";
import { NestedNavigator } from "./screens/nested/NestedNavigator";
import { ScreenA } from "./screens/ScreenA";
import { ScreenB } from "./screens/ScreenB";
import { ScreenC } from "./screens/ScreenC";
import { ScreenD } from "./screens/ScreenD";
import { ScreenE } from "./screens/ScreenE";

const RootStack = createNativeStackNavigator({
	screens: {
		Home: {
			screen: Home,
			options: {
				headerShown: false,
				contentStyle: { backgroundColor: "white" },
			},
			listeners: Transition.createConfig,
		},
		ScreenA: {
			screen: ScreenA,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					...Transition.presets.SlideFromTop(),
				}),
		},
		ScreenB: {
			screen: ScreenB,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					...Transition.presets.ZoomIn(),
				}),
		},
		ScreenC: {
			screen: ScreenC,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					...Transition.presets.SlideFromBottom(),
				}),
		},
		ScreenD: {
			screen: ScreenD,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					...Transition.presets.DraggableCard(),
				}),
		},
		ScreenE: {
			screen: ScreenE,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					...Transition.presets.ElasticCard(),
				}),
		},
		GroupA: {
			screen: GroupANavigator,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					...Transition.presets.DraggableCard(),
				}),
		},
		Custom: {
			screen: Custom,
			options: Transition.defaultScreenOptions(),
			listeners: Transition.createConfig,
		},
		Nested: {
			screen: NestedNavigator,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					...Transition.presets.SlideFromTop(),
				}),
		},
		// Mocks
		PaletteProfile: {
			screen: PaletteProfile,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					gestureEnabled: true,
					gestureDirection: ["horizontal", "vertical"],
					screenStyleInterpolator: ({ current, next, layouts: { screen } }) => {
						"worklet";

						const progress =
							current.progress.value + (next?.progress.value ?? 0);

						/** Combined */
						const scale = interpolate(progress, [0, 1, 2], [0, 1, 0.75]);
						const borderRadius = interpolate(progress, [0, 1, 2], [36, 36, 36]);

						/** Vertical */
						const translateY = interpolate(
							current.gesture.normalizedY.value,
							[-1, 1],
							[-screen.height * 0.5, screen.height * 0.5],
							"clamp",
						);

						/** Horizontal */
						const translateX = interpolate(
							current.gesture.normalizedX.value,
							[-1, 1],
							[-screen.width * 0.5, screen.width * 0.5],
							"clamp",
						);

						return {
							contentStyle: {
								transform: [
									{ scale },
									{ translateY: translateY },
									{ translateX },
								],
								borderRadius,
							},
						};
					},
					transitionSpec: {
						open: Transition.specs.DefaultSpec,
						close: Transition.specs.DefaultSpec,
					},
				}),
		},
		GalleryModal: {
			screen: GalleryModal,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					gestureDirection: "vertical",
					gestureEnabled: true,
					screenStyleInterpolator: ({ current, next, layouts }) => {
						"worklet";

						const unfocusedY = interpolate(
							next?.progress.value ?? 0,
							[0, 1],
							[0, -100],
						);
						const focusedY = interpolate(
							current?.progress.value ?? 0,
							[0, 1],
							[layouts.screen.height, 0],
						);

						return {
							contentStyle: {
								transform: [
									{ translateY: focusedY },
									{ translateY: unfocusedY },
								],
							},
						};
					},
					transitionSpec: {
						close: {
							duration: 600,
							easing: Easing.bezierFn(0.19, 1, 0.22, 1),
						},
						open: {
							duration: 600,
							easing: Easing.bezierFn(0.19, 1, 0.22, 1),
						},
					},
				}),
		},
		DeleteWarning: {
			screen: DeleteWarning,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					gestureEnabled: true,
					gestureDirection: "vertical",
					screenStyleInterpolator: ({ current, next, layouts }) => {
						"worklet";

						const progress =
							current.progress.value + (next?.progress.value ?? 0);

						const fifthHeight = layouts.screen.height / 5;

						const unfocusedY = interpolate(
							next?.progress.value ?? 0,
							[0, 1],
							[0, -fifthHeight],
						);
						const focusedY = interpolate(
							current?.progress.value ?? 0,
							[0, 1],
							[fifthHeight, 0],
						);

						const borderRadius = interpolate(progress, [0, 1, 2], [0, 0, 36]);

						return {
							contentStyle: {
								transform: [
									{ translateY: focusedY },
									{ translateY: unfocusedY },
								],
								borderRadius: borderRadius,
							},
						};
					},
					transitionSpec: {
						close: {
							duration: 600,
							easing: Easing.bezierFn(0.19, 1, 0.22, 1),
						},
						open: {
							duration: 600,
							easing: Easing.bezierFn(0.19, 1, 0.22, 1),
						},
					},
				}),
		},
	},
});

const Navigation = createStaticNavigation(RootStack);

export default function App() {
	return (
		<GestureHandlerRootView>
			<Navigation />
		</GestureHandlerRootView>
	);
}
