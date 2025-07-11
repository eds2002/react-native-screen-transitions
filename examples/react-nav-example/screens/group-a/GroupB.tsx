import { Text, View } from "react-native";

export function GroupB() {
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: "white",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Text style={{ fontSize: 18, fontWeight: "600" }}>/group-a/b</Text>
		</View>
	);
}
