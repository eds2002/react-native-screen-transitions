import { useNavigation } from "@react-navigation/native";
import { Button } from "react-native";
import Transition from "react-native-screen-transitions";

export function SecondNestedTwo() {
	const navigation = useNavigation();

	return (
		<Transition.View
			style={{
				backgroundColor: "#e5e5e5",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Button title="Go back" onPress={() => navigation.goBack()} />
		</Transition.View>
	);
}
