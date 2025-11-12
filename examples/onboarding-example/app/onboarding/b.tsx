import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function B() {
	return (
		<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
			<Text>Page B</Text>
			<Button title="Go to Page C" onPress={() => router.back()} />
		</View>
	);
}
