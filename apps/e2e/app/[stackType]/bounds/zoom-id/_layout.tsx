import { Platform } from "react-native";
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
	return focused ? (currentId ?? activeId) : (activeId ?? currentId);
};

const navigationZoomIdInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, current, active, focused }) => {
		"worklet";
		const currentId = toZoomId(current.route);
		const activeId = toZoomId(active.route);
		const id = resolveNavigationZoomId({
			currentId,
			activeId,
			focused,
		});

		if (!id) {
			return null;
		}

		const navigationStyles = bounds({
			id,
		}).navigation.zoom({ borderRadius: 48 });

		return navigationStyles;
	};

export default function NavigationZoomIdLayout() {
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
					screenStyleInterpolator: navigationZoomIdInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.FlingSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
