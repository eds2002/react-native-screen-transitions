import { BlurView } from "expo-blur";
import { interpolate } from "react-native-reanimated";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";

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
					// backdropComponent: BlurView,
					screenStyleInterpolator: ({ bounds, focused, active }) => {
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
									style: {
										backgroundColor: "#00000025",
										opacity: active.progress,
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
						close: {
							stiffness: 800,
							damping: 300,
							mass: 3,
							overshootClamping: false,
						},
					},
				}}
			/>
		</StackNavigator>
	);
}
