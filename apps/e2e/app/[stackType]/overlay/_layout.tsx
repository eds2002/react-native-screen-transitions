import {
	OverlayA,
	OverlayC,
	OverlayE,
	overlayIOSSlideOptions,
	screenIOSSlideOptions,
} from "@/components/overlay-playground";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";

export default function OverlayPlaygroundLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen
				name="index"
				options={{
					...overlayIOSSlideOptions,
					gestureEnabled: false,
					overlay: OverlayA,
					overlayMode: "float",
					overlayShown: true,
				}}
			/>
			<StackNavigator.Screen
				name="second"
				options={{
					...screenIOSSlideOptions,
				}}
			/>
			<StackNavigator.Screen
				name="third"
				options={{
					...overlayIOSSlideOptions,
					overlay: OverlayC,
					overlayMode: "float",
					overlayShown: true,
				}}
			/>
			<StackNavigator.Screen
				name="fourth"
				options={{
					...screenIOSSlideOptions,
				}}
			/>
			<StackNavigator.Screen
				name="fifth"
				options={{
					...overlayIOSSlideOptions,
					overlay: OverlayE,
					overlayMode: "float",
					overlayShown: true,
				}}
			/>
		</StackNavigator>
	);
}
