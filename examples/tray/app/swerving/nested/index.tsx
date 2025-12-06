import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function B() {
	return (
		<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
			<Text>In swerving/nested/index</Text>
			<Button
				title="Or go to B"
				onPress={() => router.push("/swerving/nested/b")}
			/>
			<Button title="Go back" onPress={router.back} />
		</View>
	);
}
