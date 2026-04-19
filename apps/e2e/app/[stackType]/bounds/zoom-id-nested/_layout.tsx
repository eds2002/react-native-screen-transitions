import { Platform } from "react-native";
import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";

const toZoomId = (route: { params?: object }) => {
	"worklet";
	const params = route.params as Record<string, unknown> | undefined;
	const rawId = params?.id;
	return typeof rawId === "string" ? rawId : null;
};

const resolveNavigationZoomId = (params: {
	currentId: string | null;
	activeId: string | null;
	focused: boolean;
}) => {
	"worklet";

	const { currentId, activeId, focused } = params;
	return focused ? currentId ?? activeId : activeId ?? currentId;
};

const nestedNavigationZoomIdInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, current, active, progress, focused }) => {
		"worklet";
		const currentId = toZoomId(current.route);
		const activeId = toZoomId(active.route);
		const id = resolveNavigationZoomId({
			currentId,
			activeId,
			focused,
		});

		if (!id) {
			return {};
		}

		const navigationStyles = bounds({
			id,
		}).navigation.zoom();

		return {
			...navigationStyles,
			backdrop: {
				backgroundColor: "black",
				opacity: interpolate(progress, [0, 1, 2], [0, 0.55, 0]),
			},
		};
	};

export default function NestedNavigationZoomIdLayout() {
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
					navigationMaskEnabled: Platform.OS === "ios",
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted", "horizontal"],
					gestureReleaseVelocityScale: 1.6,
					gestureDrivesProgress: false,
					screenStyleInterpolator: nestedNavigationZoomIdInterpolator,
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
