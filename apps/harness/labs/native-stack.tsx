// @ts-nocheck
/**
 * native-stack: the native-stack adapter. withScreenTransitions wraps a plain
 * @react-navigation/native-stack navigator; screens opt in with
 * `enableTransitions: true` (the adapter swaps them to a transparent contained
 * modal with no native animation and runs the library's interpolator instead).
 *   home   native screen (no header), source boundary "avatar"
 *   slide  enableTransitions + the shared slide() interpolator, horizontal gesture
 *   zoom   enableTransitions + bounds("avatar").navigation.zoom({ target: "bound" })
 *   plain  untouched native push (default iOS animation and swipe-back) for contrast
 *
 * Argent loop (open-native-stack first; probes read "key:value"):
 *  1. read native-stack-route → "route:home"; native-stack-avatar visible
 *  2. tap native-stack-open-slide → slide screen enters from the right, home parallaxes left;
 *     native-stack-route "route:slide"
 *  3. swipe right from the left third → back on home, route:home
 *  4. tap native-stack-open-slide, tap native-stack-back → animated back to home
 *  5. tap native-stack-avatar → zoom grows from the avatar into the large circle
 *     (native-stack-zoom-avatar); route:zoom, home dimmed and scaled behind
 *  6. swipe down from center → shrinks back into the avatar on home
 *  7. tap native-stack-avatar, tap native-stack-back → same close, route:home
 *  8. tap native-stack-open-plain → native iOS push, route:plain; swipe right from the
 *     left edge → native pop, route:home
 *  9. from plain, tap native-stack-open-slide → slide works on top of a native screen;
 *     tap native-stack-back twice → home
 */
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, LabContainer, Page, Probe, slide, Transition, type Lab } from "./ui";

const Stack = Transition.withScreenTransitions(createNativeStackNavigator());
const AVATAR = "avatar";

const zoomOptions = {
	enableTransitions: true,
	gestureEnabled: true,
	gestureDirection: "bidirectional",
	transitionSpec: Transition.Specs.Zoom,
	screenStyleInterpolator: ({ bounds }) => {
		"worklet";
		return bounds({ id: AVATAR }).navigation.zoom({ target: "bound", borderRadius: 120 });
	},
};

function Home({ navigation }) {
	return (
		<Page title="native-stack" testID="native-stack-home" color="#1e293b">
			<Probe testID="native-stack-route" value="route:home" />
			<Transition.Boundary
				id={AVATAR}
				testID="native-stack-avatar"
				accessibilityLabel="native-stack-avatar"
				onPress={() => navigation.navigate("zoom")}
				style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#f59e0b", alignItems: "center", justifyContent: "center" }}
			>
				<Text style={{ color: "white", fontSize: 32, fontWeight: "800" }}>A</Text>
			</Transition.Boundary>
			<Button label="Open slide" testID="native-stack-open-slide" onPress={() => navigation.navigate("slide")} />
			<Button label="Open plain native screen" testID="native-stack-open-plain" onPress={() => navigation.navigate("plain")} />
		</Page>
	);
}

function Slide({ navigation }) {
	return (
		<Page title="slide" testID="native-stack-slide" color="#16a34a">
			<Probe testID="native-stack-route" value="route:slide" />
			<Text style={{ color: "white" }}>enableTransitions + slide(); swipe right to go back.</Text>
			<Button label="Back" testID="native-stack-back" onPress={() => navigation.goBack()} />
		</Page>
	);
}

function Zoom({ navigation }) {
	const insets = useSafeAreaInsets();
	return (
		<View testID="native-stack-zoom" style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 20, paddingBottom: insets.bottom }}>
			<Transition.Boundary
				id={AVATAR}
				testID="native-stack-zoom-avatar"
				style={{ width: 240, height: 240, borderRadius: 120, backgroundColor: "#f59e0b", alignItems: "center", justifyContent: "center" }}
			>
				<Text style={{ color: "white", fontSize: 80, fontWeight: "800" }}>A</Text>
			</Transition.Boundary>
			<Probe testID="native-stack-route" value="route:zoom" />
			<Button label="Back" testID="native-stack-back" onPress={() => navigation.goBack()} />
		</View>
	);
}

function Plain({ navigation }) {
	return (
		<Page title="plain" testID="native-stack-plain" color="#7c3aed">
			<Probe testID="native-stack-route" value="route:plain" />
			<Text style={{ color: "white" }}>No enableTransitions: native push and swipe-back.</Text>
			<Button label="Open slide" testID="native-stack-open-slide" onPress={() => navigation.navigate("slide")} />
			<Button label="Back" testID="native-stack-back" onPress={() => navigation.goBack()} />
		</Page>
	);
}

function Component() {
	return (
		<LabContainer>
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				<Stack.Screen name="home" component={Home} />
				<Stack.Screen name="slide" component={Slide} options={{ enableTransitions: true, ...slide() }} />
				<Stack.Screen name="zoom" component={Zoom} options={zoomOptions} />
				<Stack.Screen name="plain" component={Plain} />
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "native-stack",
	title: "native-stack",
	covers: "withScreenTransitions(native stack): enableTransitions slide + gesture, boundary zoom, plain native push",
	Component,
};
