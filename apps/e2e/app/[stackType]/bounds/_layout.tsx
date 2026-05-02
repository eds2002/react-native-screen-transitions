import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { IOSSlide } from "@/lib/screen-transitions/ios-slide";

export default function BoundsLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen name="style-id" options={{ ...IOSSlide() }} />
			<StackNavigator.Screen name="zoom" options={{ ...IOSSlide() }} />
			<StackNavigator.Screen name="zoom-id" options={{ ...IOSSlide() }} />
			<StackNavigator.Screen name="sync" options={{ ...IOSSlide() }} />
		</StackNavigator>
	);
}
