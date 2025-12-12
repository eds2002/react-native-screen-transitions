import { useGlobalSearchParams } from "expo-router";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function StyleIdLayout() {
	const { sharedBoundId } = useGlobalSearchParams<{ sharedBoundId: string }>();
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{ title: "Bounds + Style Id", headerShown: false }}
			/>
			<Stack.Screen
				name="[id]"
				options={{
					...Transition.Presets.SharedIGImage({
						sharedBoundTag: sharedBoundId,
					}),
				}}
			/>
		</Stack>
	);
}
