import { Stack } from "expo-router";

import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
	return <RootLayoutNav />;
}

function RootLayoutNav() {
	return (
		<GestureHandlerRootView>
			<Stack screenOptions={{ headerShown: false }} />
		</GestureHandlerRootView>
	);
}
