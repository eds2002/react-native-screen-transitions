import { router } from "expo-router";
import { Button, Text } from "react-native";
import { Header } from "@/components/header";
import { Tray } from "@/components/tray";

export default function Screen() {
	return (
		<Tray.View
			snapPoint="50%"
			backgroundColor="#e5e5e5"
			style={{
				flex: 1,
				alignItems: "center",
				padding: 24,
			}}
		>
			<Header />
			<Button
				title="Go to B"
				onPress={() => router.navigate("/tray-routes/b")}
			/>
		</Tray.View>
	);
}
