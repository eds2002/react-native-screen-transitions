import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Easing, interpolate, interpolateColor } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import Custom from "./screens/Custom";
import { GroupANavigator } from "./screens/group-a/GroupANavigator";
import { Home } from "./screens/Home";
import DeleteWarning from "./screens/mocks/delete-warning";
import FullscreenNav from "./screens/mocks/fullscreen-nav";
import GalleryModal from "./screens/mocks/gallery-modal";
import PaletteProfile from "./screens/mocks/palette-profile";
import { NestedNavigator } from "./screens/nested/NestedNavigator";
import { ScreenA } from "./screens/ScreenA";
import { ScreenB } from "./screens/ScreenB";
import { ScreenC } from "./screens/ScreenC";
import { ScreenD } from "./screens/ScreenD";
import { ScreenE } from "./screens/ScreenE";

const Stack = Transition.createTransitionableStackNavigator();

export default function App() {
	return (
		<GestureHandlerRootView>
			<NavigationContainer>
				<Stack.Navigator>
					<Stack.Screen
						name="Home"
						component={Home}
						options={{
							headerShown: false,
							contentStyle: { backgroundColor: "white" },
							skipDefaultScreenOptions: true,
						}}
					/>
					<Stack.Screen
						name="ScreenA"
						component={ScreenA}
						options={{
							...Transition.presets.SlideFromTop(),
						}}
					/>
					<Stack.Screen
						name="ScreenB"
						component={ScreenB}
						options={{
							...Transition.presets.ZoomIn(),
						}}
					/>
					<Stack.Screen
						name="ScreenC"
						component={ScreenC}
						options={{
							...Transition.presets.SlideFromBottom(),
						}}
					/>
					<Stack.Screen
						name="ScreenD"
						component={ScreenD}
						options={{
							...Transition.presets.DraggableCard(),
						}}
					/>
					<Stack.Screen
						name="ScreenE"
						component={ScreenE}
						options={{
							...Transition.presets.ElasticCard(),
						}}
					/>
					<Stack.Screen
						name="GroupA"
						component={GroupANavigator}
						options={{
							...Transition.presets.DraggableCard(),
						}}
					/>
					<Stack.Screen name="Custom" component={Custom} />
					<Stack.Screen
						name="Nested"
						component={NestedNavigator}
						options={{
							...Transition.presets.SlideFromTop(),
						}}
					/>
					{/* Mocks */}
					<Stack.Screen
						name="PaletteProfile"
						component={PaletteProfile}
						options={{
							gestureEnabled: true,
							gestureDirection: ["horizontal", "vertical"],
							screenStyleInterpolator: ({
								current,
								next,
								layouts: { screen },
							}) => {
								"worklet";

								const progress =
									current.progress.value + (next?.progress.value ?? 0);

								/** Combined */
								const scale = interpolate(progress, [0, 1, 2], [0, 1, 0.75]);
								const borderRadius = interpolate(
									progress,
									[0, 1, 2],
									[36, 36, 36],
								);

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
						}}
					/>
					<Stack.Screen
						name="GalleryModal"
						component={GalleryModal}
						options={{
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
						}}
					/>
					<Stack.Screen
						name="DeleteWarning"
						component={DeleteWarning}
						options={{
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

								const borderRadius = interpolate(
									progress,
									[0, 1, 2],
									[0, 0, 36],
								);

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
						}}
					/>
					<Stack.Screen
						name="FullscreenNav"
						component={FullscreenNav}
						options={{
							screenStyleInterpolator: ({ current, next }) => {
								"worklet";

								const overlay = interpolateColor(
									current.progress.value,
									[0, 1],
									["rgba(0,0,0,0)", "rgba(0,0,0,0.85)"],
								);

								return {
									overlayStyle: {
										backgroundColor: !next ? overlay : "rgba(0,0,0,0)",
									},
								};
							},
						}}
					/>
				</Stack.Navigator>
			</NavigationContainer>
		</GestureHandlerRootView>
	);
}
