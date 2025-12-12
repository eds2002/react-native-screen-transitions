import { router } from "expo-router";
import { Button, View } from "react-native";

export default function App() {
	return (
		<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
			<Button
				title="Linear tray routes"
				onPress={() => router.navigate("/linear")}
			/>
			<Button
				title="Nested tray routes"
				onPress={() =>
					router.navigate({
						pathname: "/swerving",
					})
				}
			/>
		</View>
	);
}
