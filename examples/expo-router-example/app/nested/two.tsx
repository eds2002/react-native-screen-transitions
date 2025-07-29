import { router } from "expo-router";
import { Button, View } from "react-native";

export default function Two() {
	return (
		<View
			style={{
				backgroundColor: "#fafaf9",
				alignItems: "center",
				justifyContent: "center",
				flex: 1,
			}}
		>
			<Button title="Go back" onPress={router.back} />
		</View>
	);
}
