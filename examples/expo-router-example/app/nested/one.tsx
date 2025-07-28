import { router } from "expo-router";
import { Button, View } from "react-native";

export default function One() {
	return (
		<View
			style={{
				backgroundColor: "#fafaf9",
				alignItems: "center",
				justifyContent: "center",
				flex: 1,
			}}
		>
			<Button
				title="Go to second-nested/index"
				onPress={() => router.push("/nested/second-nested/one")}
			/>
			<Button
				title="Go to nested/two"
				onPress={() => router.push("/nested/two")}
			/>
			<Button title="Go back" onPress={router.back} />
		</View>
	);
}
