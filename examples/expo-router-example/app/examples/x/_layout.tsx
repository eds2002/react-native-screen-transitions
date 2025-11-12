import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function RootLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ headerShown: false }} />
			<Stack.Screen
				name="[id]"
				options={{
					...Transition.Presets.SharedXImage(),
				}}
			/>
		</Stack>
	);
}
