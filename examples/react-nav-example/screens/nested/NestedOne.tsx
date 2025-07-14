import { useNavigation } from "@react-navigation/native";
import { Button } from "react-native";
import Transition from "react-native-screen-transitions";

export function NestedOne() {
	const navigation = useNavigation();

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
				onPress={() => navigation.navigate("SecondNested" as never)}
			/>
			<Button
				title="Go to nested/two"
				onPress={() => navigation.navigate("NestedTwo" as never)}
			/>
			<Button title="Go back" onPress={() => navigation.goBack()} />
		</Transition.View>
	);
}
