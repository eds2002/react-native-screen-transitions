import { Text } from "react-native";
import Transition from "react-native-screen-transitions";

export default function NestedScrollableGestures() {
	return (
		<Transition.ScrollView
			contentContainerStyle={{
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: 16,
				flex: 1,
				padding: 16,
			}}
		>
			<Text style={{ textAlign: "center" }}>
				The navigator has a vertical gesture defined.
			</Text>
			<Text style={{ textAlign: "center" }}>
				This screen has a horizontal gesture defined.
			</Text>
			<Text style={{ textAlign: "center" }}>
				This screen should be able to activate the navigator gesture.
			</Text>
		</Transition.ScrollView>
	);
}
