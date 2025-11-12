import { Stack } from "expo-router";
import "react-native-reanimated";

export default function RootLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: {
					backgroundColor: "#FFF",
				},
			}}
		/>
	);
}
