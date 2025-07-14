import { router } from "expo-router";
import { Button } from "react-native";
import Transition from "react-native-screen-transitions";

export default function One() {
	return (
		<Transition.View
			style={{
				backgroundColor: "#e5e5e5",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Button
				title="Go to second-nested/two"
				onPress={() => router.push("/nested/second-nested/two")}
			/>
			<Button title="Go back" onPress={router.back} />
		</Transition.View>
	);
}
