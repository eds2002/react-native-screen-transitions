import { Text, View } from "react-native";

export default function B() {
	return (
		<View
			style={{
				alignItems: "center",
				justifyContent: "center",
				flex: 1,
				padding: 16,
			}}
		>
			<Text style={{ textAlign: "center" }}>
				Simulates React Navigation Error:
			</Text>
			<Text style={{ textAlign: "center" }}>
				'The screen SCREEN_NAME was removed natively but didn't get removed from
				JS state.'
			</Text>
		</View>
	);
}
