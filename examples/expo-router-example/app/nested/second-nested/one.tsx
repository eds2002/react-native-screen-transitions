import { router } from "expo-router";
import { Button, View } from "react-native";

export default function One() {
	return (
		<View
			style={{
				alignItems: "center",
				justifyContent: "center",
				flex: 1,
			}}
		>
			<Button
				title="Go to second-nested/two"
				onPress={() => router.push("/nested/second-nested/two")}
			/>
			<Button title="Go back" onPress={router.back} />
		</View>
	);
}
