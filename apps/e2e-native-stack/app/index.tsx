import { type Href, router } from "expo-router";
import { Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ModalScreen() {
	const TEST_ROUTES: Href[] = [];
	return (
		<SafeAreaView>
			{TEST_ROUTES.map((route) => (
				<Button
					key={route as string}
					title={route as string}
					onPress={() => {
						router.navigate(route);
					}}
				/>
			))}
		</SafeAreaView>
	);
}
