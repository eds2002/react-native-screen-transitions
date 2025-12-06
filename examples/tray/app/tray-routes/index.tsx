import { router } from "expo-router";
import { Button, Text } from "react-native";
import { Card } from "@/components/card";
import { Header } from "@/components/header";
import { Tray } from "@/components/tray";

export default function Screen() {
	return (
		<Tray.View snapPoint="50%" backgroundColor="#FFF">
			<Tray.Header title="Screen A" />
			<Tray.Content style={{ gap: 4 }}>
				<Card
					title="Go to Tray B"
					description="Take me to Tray B"
					variant="success"
					onPress={() => router.push("/tray-routes/b")}
				/>
				<Card
					title="Or go back"
					description="I would rather go back"
					variant="error"
					onPress={router.back}
				/>
			</Tray.Content>
		</Tray.View>
	);
}
