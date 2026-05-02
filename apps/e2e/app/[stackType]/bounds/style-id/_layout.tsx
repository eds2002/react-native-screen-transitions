// @ts-nocheck
import { interpolate } from "react-native-reanimated";
import Transition, {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";

const toStyleIdBoundTag = (route?: { params?: object }) => {
	"worklet";
	const params = route?.params as Record<string, unknown> | undefined;
	const rawId = params?.id;
	return typeof rawId === "string" ? rawId : "";
};

export default function StyleIdBoundsLayout() {
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
					navigationMaskEnabled: true,
					gestureEnabled: true,
					gestureDirection: ["vertical"],
					screenStyleInterpolator: ({
						current,
						layouts: { screen },
						bounds,
						progress,
						focused,
						next,
						active,
					}) => {
						"worklet";
						const boundTag =
							toStyleIdBoundTag(current.route) ||
							toStyleIdBoundTag(active.route) ||
							toStyleIdBoundTag(next?.route);

						if (!boundTag) {
							return {};
						}

						const x = interpolate(
							focused ? current.gesture.normX : (next?.gesture.normX ?? 0),
							[-1, 1],
							[-screen.width * 0.5, screen.width * 0.5],
							"clamp",
						);
						const y = interpolate(
							focused ? current.gesture.normY : (next?.gesture.normY ?? 0),
							[-1, 1],
							[-screen.height * 0.5, screen.height * 0.5],
							"clamp",
						);

						if (focused) {
							const focusedBoundStyles = bounds({
								id: boundTag,
								method: "content",
								anchor: "top",
								scaleMode: "uniform",
							});

							const focusMaskStyles = bounds({
								id: boundTag,
								space: "absolute",
								target: "fullscreen",
								method: "size",
							});

							return {
								backdrop: {
									style: {
										backgroundColor: "black",
										opacity: interpolate(progress, [0, 1], [0, 0.75]),
									},
								},
								content: {
									style: {
										transform: [{ translateX: x }, { translateY: y }],
									},
								},
								_NAVIGATION_ROOT_CONTAINER: focusedBoundStyles,
								_NAVIGATION_ROOT_MASK: {
									...focusMaskStyles,
									borderRadius: interpolate(progress, [0, 1], [24, 24]),
								},
							};
						}

						const unfocusedBound = bounds({
							id: boundTag,
							gestures: { x, y },
						});

						return {
							content: {
								style: {
									transform: [
										{
											scale: interpolate(progress, [1, 2], [1, 0.9]),
										},
									],
								},
							},
							[boundTag]: unfocusedBound,
						};
					},
					transitionSpec: {
						open: { ...Transition.Specs.DefaultSpec, mass: 2 },
						close: { ...Transition.Specs.DefaultSpec, mass: 2 },
					},
				}}
			/>
		</StackNavigator>
	);
}
