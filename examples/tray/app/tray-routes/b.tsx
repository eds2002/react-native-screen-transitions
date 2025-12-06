import { router } from "expo-router";
import { Card } from "@/components/card";
import { Tray } from "@/components/tray";

export default function Screen() {
	return (
		<Tray.View snapPoint="70%" backgroundColor="#FFF">
			<Tray.Header title="Screen B" />
			<Tray.Content style={{ gap: 4 }}>
				<Card title="Card 1" description="Some card description" />
				<Card title="Card 1" description="Some card description" />
				<Card title="Card 1" description="Some card description" />
				<Card title="Card 1" description="Some card description" />
				<Card
					title="Go to Tray C"
					description="Take me to Tray B"
					onPress={() => router.push("/tray-routes/c")}
					variant="success"
				/>
				<Card
					title="Or go back to Tray B"
					description="TKAE ME BACKKKK!K!K!K!K!K!KK!K!K"
					variant="error"
					onPress={router.back}
				/>
			</Tray.Content>
		</Tray.View>
	);
}
