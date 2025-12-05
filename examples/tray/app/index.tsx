import { router } from "expo-router";
import { Button, View } from "react-native";

export default function App() {
	return (
		<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
			<Button
				title="Tray routes"
				onPress={() => router.navigate("/tray-routes")}
			/>
		</View>
	);
}
