// @ts-nocheck
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";

export default function BoundsLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="active"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<StackNavigator.Screen
				name="gesture"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<StackNavigator.Screen
				name="style-id"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<StackNavigator.Screen
				name="spam"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<StackNavigator.Screen
				name="zoom"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<StackNavigator.Screen
				name="zoom-id"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<StackNavigator.Screen
				name="sync"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<StackNavigator.Screen
				name="gallery"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<StackNavigator.Screen
				name="example"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
		</StackNavigator>
	);
}
