import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Index() {
	return (
		<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
			<Text>Welcome to Expo Router!</Text>
			<Button title="Get Started" onPress={() => router.push("/onboarding")} />
		</View>
	);
}
