import { router } from "expo-router";
import { Button, Text } from "react-native";
import { Tray } from "@/components/tray";

export default function Screen() {
	return (
		<Tray.Root snapPoint="50%" backgroundColor="#e5e5e5">
			<Tray.Content>
				<Text>Hello</Text>
				<Button
					title="Go to B"
					onPress={() => router.navigate("/tray-routes/b")}
				/>
			</Tray.Content>
		</Tray.Root>
	);
}
