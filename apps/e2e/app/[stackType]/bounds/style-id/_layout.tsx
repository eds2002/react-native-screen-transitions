import { BlurView } from "expo-blur";
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
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
					gestureDirection: ["vertical", "horizontal", "vertical-inverted"],
					backdropComponent: BlurView,
					screenStyleInterpolator: ({
						current,
						bounds,
						focused,
						next,
						active,
					}) => {
						"worklet";
						const boundTag = active?.route?.params?.id;

						if (!boundTag) {
							return {};
						}

						const revealStyles = bounds({
							id: boundTag,
						}).navigation.reveal();

						if (focused) {
							return {
								...revealStyles,
								backdrop: {
									props: {
										intensity: interpolate(
											active.progress - active.gesture.normY,
											[0, 1],
											[0, 50],
										),
									},
								},
							};
						}

						return revealStyles;
					},
					transitionSpec: {
						open: {
							stiffness: 750,
							damping: 1000,
							mass: 3,
							overshootClamping: false,
						},
						close: { ...Transition.Specs.DefaultSpec, mass: 2.5 },
					},
				}}
			/>
		</StackNavigator>
	);
}
