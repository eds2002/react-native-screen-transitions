import { useGlobalSearchParams } from "expo-router";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";

const FALLBACK_BOUND_TAG = "shared-x-image-fallback";

const getSingleParam = (value: string | string[] | undefined) =>
	Array.isArray(value) ? value[0] : value;

export default function SharedXImageLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;
	const params = useGlobalSearchParams<{ boundId?: string | string[] }>();
	const boundId = getSingleParam(params.boundId) ?? FALLBACK_BOUND_TAG;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen
				name="index"
				options={{ headerShown: false }}
			/>
			<StackNavigator.Screen
				name="[id]"
				options={{
					headerShown: false,
					...Transition.Presets.SharedXImage({
						sharedBoundTag: boundId,
					}),
				}}
			/>
		</StackNavigator>
	);
}
