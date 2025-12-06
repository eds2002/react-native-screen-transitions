import { router } from "expo-router";
import { Card } from "@/components/card";
import { Tray } from "@/components/tray";

export default function Screen() {
	return (
		<Tray.View snapPoint="50%" backgroundColor="#FFF">
			<Tray.Header title="Screen A" />
			<Tray.Content style={{ gap: 4 }}>
				<Card
					title="Go to swerving/nested"
					description="This will take us to a full screen flow."
					variant="success"
					onPress={() => router.navigate("/swerving/nested")}
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
