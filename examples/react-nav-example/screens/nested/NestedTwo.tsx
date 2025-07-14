import { useNavigation } from "@react-navigation/native";
import { Button } from "react-native";
import Transition from "react-native-screen-transitions";

export function NestedTwo() {
	const navigation = useNavigation();

	return (
		<Transition.View
			style={{
				backgroundColor: "#fafaf9",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Button title="Go back" onPress={() => navigation.goBack()} />
		</Transition.View>
	);
}
