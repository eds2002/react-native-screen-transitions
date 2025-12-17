import { Stack as ExpoStack } from "expo-router";
import "react-native-reanimated";

export default function RootLayout() {
	return (
		<ExpoStack screenOptions={{ headerShown: false }}>
			<ExpoStack.Screen name="index" />
			<ExpoStack.Screen name="native-stack" />
			<ExpoStack.Screen name="blank-stack" />
		</ExpoStack>
	);
}
