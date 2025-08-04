import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import Transition from "react-native-screen-transitions";

export default function ActiveBoundsScreen() {
	const { id } = useLocalSearchParams();
	return (
		<View
			style={{
				flex: 1,
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Transition.View styleId={`active-bounds-${id.toString()}`} />
		</View>
	);
}
