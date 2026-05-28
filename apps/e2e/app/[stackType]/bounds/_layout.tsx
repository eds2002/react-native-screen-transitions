import { BlankStack } from "@/layouts/blank-stack";
import { IOSSlide } from "@/lib/screen-transitions/ios-slide";

export default function BoundsLayout() {
	const StackNavigator = BlankStack;

	return (
		<StackNavigator>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen name="style-id" options={{ ...IOSSlide() }} />
			<StackNavigator.Screen name="zoom" options={{ ...IOSSlide() }} />
			<StackNavigator.Screen name="zoom-id" options={{ ...IOSSlide() }} />
			<StackNavigator.Screen name="sync" options={{ ...IOSSlide() }} />
			<StackNavigator.Screen
				name="transition-scope"
				options={{ ...IOSSlide() }}
			/>
		</StackNavigator>
	);
}
