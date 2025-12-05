import { router } from "expo-router";
import { Button, Text } from "react-native";
import { Tray } from "@/components/tray";

export default function Screen() {
	return (
		<Tray.Root snapPoint="60%" backgroundColor="#e5e5e5">
			<Tray.Content>
				<Text>Oh hi im C</Text>
				<Button title="Go back" onPress={router.back} />
			</Tray.Content>
		</Tray.Root>
	);
}
