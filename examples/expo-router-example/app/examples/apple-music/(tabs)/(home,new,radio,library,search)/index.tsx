import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function IndexScreen() {
	return (
		<View>
			<Text>Index Screen</Text>
			<Button
				title="Go to Id"
				onPress={() => router.push("/examples/apple-music/123")}
			/>
		</View>
	);
}
