import { router } from "expo-router";
import { Card } from "@/components/card";
import { Tray } from "@/components/tray";

export default function Screen() {
	return (
		<Tray.View snapPoint="25%" backgroundColor="#FFF">
			<Tray.Header title="Screen C" />
			<Tray.Content>
				<Card
					title="Go back"
					description="Take me back bruh"
					onPress={router.back}
				/>
			</Tray.Content>
		</Tray.View>
	);
}
