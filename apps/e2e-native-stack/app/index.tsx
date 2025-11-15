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
		href: "/e2e/gestures/bi-directional",
		testID: "e2e-bi-directional",
		label: "Bi-directional gestures",
	},
	{
		href: "/e2e/gestures/gesture-dismissal",
		testID: "e2e-gesture-dismissal",
		label: "Gesture dismissal logic",
	},
	{
		href: "/e2e/gestures-scrollables/vertical",
		testID: "e2e-scrollable-vertical",
		label: "Scrollables (vertical)",
	},
	{
		href: "/e2e/gestures-scrollables/horizontal",
		testID: "e2e-scrollable-horizontal",
		label: "Scrollables (horizontal)",
	},
	{
		href: "/e2e/gestures-scrollables/nested",
		testID: "e2e-scrollable-nested",
		label: "Scrollables (nested)",
	},
	{
		href: "/e2e/gesture-edges/all-edges",
		testID: "e2e-gesture-edges-all-edges",
		label: "Gesture edges (all)",
	},
	{
		href: "/e2e/gesture-edges/custom-edges",
		testID: "e2e-gesture-edges-custom-edges",
		label: "Gesture edges (custom)",
	},
	{
		href: "/e2e/bounds/anchor-point",
		testID: "e2e-bounds-anchor-point",
		label: "Bounds: anchor point",
	},
	{
		href: "/e2e/bounds/custom-bounds",
		testID: "e2e-bounds-custom-bounds",
		label: "Bounds: custom bounds",
	},
	{
		href: "/e2e/bounds/longer-flow/a",
		testID: "e2e-bounds-longer-flow",
		label: "Bounds: longer flow",
	},
	{
		href: "/e2e/bounds/list",
		testID: "e2e-bounds-list",
		label: "Bounds: list",
	},
];

export default function ModalScreen() {
	return (
		<SafeAreaView testID="HOME_PAGE">
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
