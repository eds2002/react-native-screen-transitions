import { type Href, router } from "expo-router";
import { Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ModalScreen() {
	const TEST_ROUTES: Href[] = [
		"/e2e/navigation",
		"/e2e/gestures/all-gesture-directions",
		"/e2e/gestures/bi-directional",
		"/e2e/gestures/gesture-dismissal",
		"/e2e/gestures-scrollables/vertical",
		"/e2e/gestures-scrollables/horizontal",
		"/e2e/gestures-scrollables/nested",
		"/e2e/gesture-edges/all-edges",
		"/e2e/gesture-edges/custom-edges",
		"/e2e/bounds/anchor-point",
		"/e2e/bounds/custom-bounds",
		"/e2e/bounds/longer-flow/a",
		"/e2e/bounds/list",
	];
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
