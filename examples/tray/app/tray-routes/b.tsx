import { router } from "expo-router";
import { Button, Text } from "react-native";
import { Tray } from "@/components/tray";

export default function Screen() {
	return (
		<Tray.Root snapPoint="30%" backgroundColor="#e5e5e5">
			<Tray.Content>
				<Text>Hi, Im B</Text>
				<Text>Hi, Im B</Text>
				<Text>Hi, Im B</Text>
				<Text>Hi, Im B</Text>
				<Button
					title="Go to C"
					onPress={() => router.navigate("/tray-routes/c")}
				/>
				<Button title="Go back" onPress={router.back} />
			</Tray.Content>
		</Tray.Root>
	);
}
