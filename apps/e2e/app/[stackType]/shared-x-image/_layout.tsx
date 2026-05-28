import { useGlobalSearchParams } from "expo-router";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

const FALLBACK_BOUND_TAG = "shared-x-image-fallback";

const getSingleParam = (value: string | string[] | undefined) =>
	Array.isArray(value) ? value[0] : value;

export default function SharedXImageLayout() {
	const StackNavigator = BlankStack;
	const params = useGlobalSearchParams<{ boundId?: string | string[] }>();
	const boundId = getSingleParam(params.boundId) ?? FALLBACK_BOUND_TAG;

	return (
		<StackNavigator>
			<StackNavigator.Screen name="index" options={{ headerShown: false }} />
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
