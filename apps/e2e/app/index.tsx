import { type Href, router } from "expo-router";
import { Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TEST_ROUTES: Array<{ href: Href; testID: string; label: string }> = [
	{
		href: "/e2e/navigation",
		testID: "e2e-navigation",
		label: "Push/back navigation",
	},
	{
		href: "/e2e/gestures/all-gesture-directions",
		testID: "e2e-gesture-directions",
		label: "Gesture directions",
	},
	{
		href: "/e2e/gestures-scrollables/vertical",
		testID: "e2e-scrollable-vertical",
		label: "Scrollables (vertical)",
	},
	{
		href: "/e2e/bounds/longer-flow/a",
		testID: "e2e-bounds-longer-flow",
		label: "Bounds: longer flow",
	},
];

export default function ModalScreen() {
	return (
		<SafeAreaView
			testID="HOME_PAGE"
			style={{ alignItems: "center", justifyContent: "center", flex: 1 }}
		>
			{TEST_ROUTES.map((route) => (
				<Button
					key={route.testID}
					title={route.label}
					testID={route.testID}
					onPress={() => {
						router.navigate(route.href);
					}}
				/>
			))}
		</SafeAreaView>
	);
}
