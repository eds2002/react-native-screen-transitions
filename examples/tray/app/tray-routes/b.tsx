import { router } from "expo-router";
import { Button, Text } from "react-native";
import { Header } from "@/components/header";
import { Tray } from "@/components/tray";

export default function Screen() {
	return (
		<Tray.View
			snapPoint="80%"
			backgroundColor="#e5e5e5"
			style={{
				flex: 1,
				alignItems: "center",
				padding: 24,
			}}
		>
			<Header />
			<Text>Hi, Im B</Text>
			<Text>Hi, Im B</Text>
			<Text>Hi, Im B</Text>
			<Text>Hi, Im B</Text>
			<Button
				title="Go to C"
				onPress={() => router.navigate("/tray-routes/c")}
			/>
			<Button title="Go back" onPress={router.back} />
		</Tray.View>
	);
}
