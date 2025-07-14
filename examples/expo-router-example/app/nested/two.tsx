import { router } from "expo-router";
import { Button } from "react-native";
import Transition from "react-native-screen-transitions";

export default function Two() {
	return (
		<Transition.View
			style={{
				backgroundColor: "#fafaf9",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Button title="Go back" onPress={router.back} />
		</Transition.View>
	);
}
