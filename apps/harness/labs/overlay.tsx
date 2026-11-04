// @ts-nocheck
/**
 * overlay: covers the `overlay` screen option and `overlayShown`. Screen A declares
 * an overlay (a bottom bar reading props.focusedRoute) with overlayShown: true;
 * B and C declare none. The overlay belongs to A but floats above the stack, so it
 * must persist while B and C are pushed and keep reporting the focused route.
 * `overlayShown` is toggled with A's `navigation.setOptions` (A's navigation is kept
 * module-level so the toggle also works from C, two screens above the owner).
 *
 * testIDs: overlay-bar (the overlay itself), overlay-focused "focused:<route>",
 * overlay-owner "owner:A", overlay-index "index:<focusedIndex>/<routes>",
 * overlay-shown "shown:<bool>" (on every screen).
 *
 * Argent loop:
 *  1. Open lab (open-overlay). Expect overlay-a and overlay-bar with focused:A,
 *     owner:A, index:0/1.
 *  2. Tap overlay-push-b. After 1s expect overlay-b, overlay-bar still present with
 *     focused:B, index:1/2.
 *  3. Tap overlay-push-c. Expect overlay-c, overlay-bar focused:C, index:2/3.
 *  4. Tap overlay-toggle on C. Expect overlay-shown "shown:false" and no overlay-bar.
 *  5. Tap overlay-toggle again. Expect shown:true and overlay-bar back with focused:C.
 *  6. Tap overlay-back twice. Expect overlay-a, overlay-bar focused:A, index:0/1.
 *  7. Tap overlay-toggle on A. Expect no overlay-bar. Tap overlay-push-b: still no
 *     overlay-bar on B. Tap overlay-back, tap overlay-toggle: overlay-bar focused:A.
 */
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Button, createBlankStackNavigator, LabContainer, Page, Probe, slide, type Lab } from "./ui";

const Stack = createBlankStackNavigator();

/** Owner state shared by every screen: A's navigation (for setOptions) and the current flag. */
const owner = { navigation: null, shown: true, listeners: new Set<() => void>() };

function setShown(shown: boolean) {
	owner.shown = shown;
	owner.navigation?.setOptions({ overlayShown: shown });
	owner.listeners.forEach((listener) => listener());
}

function useShown() {
	const [, refresh] = useState(0);
	useEffect(() => {
		const listener = () => refresh((value) => value + 1);
		owner.listeners.add(listener);
		return () => owner.listeners.delete(listener);
	}, []);
	return owner.shown;
}

/** The overlay: module-level so its identity is stable (the host keeps the first one). */
function Bar({ focusedRoute, focusedIndex, routes, route }) {
	return (
		<View pointerEvents="box-none" style={{ position: "absolute", left: 16, right: 16, bottom: 34 }}>
			<View testID="overlay-bar" style={{ backgroundColor: "#0b0b0fee", borderRadius: 16, padding: 14, gap: 2 }}>
				<Text testID="overlay-focused" style={{ color: "white", fontSize: 18, fontWeight: "800" }}>
					focused:{focusedRoute?.name}
				</Text>
				<Text testID="overlay-owner" style={{ color: "#aaa", fontFamily: "Menlo", fontSize: 12 }}>
					owner:{route?.name}
				</Text>
				<Text testID="overlay-index" style={{ color: "#aaa", fontFamily: "Menlo", fontSize: 12 }}>
					index:{focusedIndex}/{routes?.length}
				</Text>
			</View>
		</View>
	);
}

function Toggle() {
	const shown = useShown();
	return (
		<>
			<Probe testID="overlay-shown" value={`shown:${shown}`} />
			<Button label={shown ? "hide overlay (overlayShown: false)" : "show overlay (overlayShown: true)"} testID="overlay-toggle" onPress={() => setShown(!shown)} />
		</>
	);
}

function A({ navigation }) {
	// No cleanup: A's effects are torn down while it is hidden two screens down,
	// and the toggle on C still needs A's navigation then.
	useEffect(() => {
		owner.navigation = navigation;
	}, [navigation]);
	return (
		<Page title="A" testID="overlay-a">
			<Probe testID="overlay-a-note" value="declares:overlay" />
			<Toggle />
			<Button label="push B" testID="overlay-push-b" onPress={() => navigation.push("B")} />
		</Page>
	);
}

function B({ navigation }) {
	return (
		<Page title="B" testID="overlay-b">
			<Toggle />
			<Button label="push C" testID="overlay-push-c" onPress={() => navigation.push("C")} />
			<Button label="back" testID="overlay-back" onPress={() => navigation.goBack()} />
		</Page>
	);
}

function C({ navigation }) {
	return (
		<Page title="C" testID="overlay-c">
			<Toggle />
			<Button label="back" testID="overlay-back" onPress={() => navigation.goBack()} />
		</Page>
	);
}

function Component() {
	// A new navigator starts with overlayShown: true again.
	useState(() => {
		owner.shown = true;
		owner.navigation = null;
	});
	return (
		<LabContainer>
			<Stack.Navigator>
				<Stack.Screen name="A" component={A} options={slide("horizontal", { overlay: Bar, overlayShown: true })} />
				<Stack.Screen name="B" component={B} options={slide()} />
				<Stack.Screen name="C" component={C} options={slide()} />
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "overlay",
	title: "overlay",
	covers: "overlay option + overlayShown (setOptions from the owner), overlay persists over pushed screens and reads focusedRoute",
	Component,
};
