import { router } from "expo-router";
import { Button } from "react-native";
import Transition from "react-native-screen-transitions";

export default function One() {
	return (
		<Transition.View
			style={{
				backgroundColor: "#fafaf9",
				alignItems: "center",
				justifyContent: "center",
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
		</Transition.View>
	);
}
