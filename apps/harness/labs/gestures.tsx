// @ts-nocheck
/**
 * gestures: when a dismiss gesture activates, per screen, in one flat stack.
 * Covers direction arrays (["horizontal","vertical"]), edge-only activation
 * ({gesture:"horizontal",area:"edge"}, 50pt from the left), a px activation
 * area ([{gesture:"vertical",area:96},"horizontal"]), pinch-in and pinch-out,
 * and gestureEnabled:false toggled at runtime through setOptions together with
 * gestureDirection horizontal <-> vertical. The interpolator is a plain slide
 * (scale/opacity for pinch); its math is not under test.
 *
 * Probe `gestures-focused` ("focused:<route>") sits bottom-left over every
 * screen and passes touches through. Coordinates are normalized (x,y).
 *
 * Argent loop:
 *  1. tap open-gestures → expect gestures-home, gestures-focused "focused:home"
 *  2. tap gestures-open-card; swipe 0.1,0.5 → 0.9,0.5 → expect "focused:home"
 *  3. tap gestures-open-card; swipe 0.5,0.3 → 0.5,0.9 → expect "focused:home" (vertical entry of the array)
 *  4. tap gestures-open-card; swipe 0.9,0.5 → 0.1,0.5 and 0.5,0.8 → 0.5,0.2 → expect "focused:card" (nothing)
 *  5. tap gestures-open-edge; swipe 0.5,0.5 → 0.95,0.5 → expect "focused:edge" (starts outside the 50pt edge)
 *  6. swipe 0.02,0.5 → 0.9,0.5 → expect "focused:home" (edge start dismisses)
 *  7. tap gestures-open-area; swipe 0.5,0.4 → 0.5,0.95 → expect "focused:area" (outside the 96pt top band)
 *  8. swipe 0.5,0.08 → 0.5,0.8 → expect "focused:home" (inside the band; avoid y<0.04, Notification Center)
 *  9. tap gestures-open-area; swipe 0.1,0.5 → 0.9,0.5 → expect "focused:home" (horizontal has no area limit)
 * 10. tap gestures-open-pinch-in; pinch out (spread) at 0.5,0.5 → expect "focused:pinch-in" (nothing);
 *     pinch in (fingers together) at 0.5,0.5 → expect "focused:home"
 * 11. tap gestures-open-pinch-out; pinch in → expect "focused:pinch-out"; pinch out (spread) → expect "focused:home"
 * 12. tap gestures-open-runtime → expect gestures-runtime-options "enabled:false direction:horizontal";
 *     swipe 0.1,0.5 → 0.9,0.5 → expect "focused:runtime" (disabled)
 * 13. tap gestures-toggle-enabled → expect "enabled:true direction:horizontal"; swipe 0.1,0.5 → 0.9,0.5 → expect "focused:home"
 * 14. tap gestures-open-runtime, gestures-toggle-enabled, gestures-toggle-direction → expect "enabled:true direction:vertical";
 *     swipe 0.1,0.5 → 0.9,0.5 → expect "focused:runtime"; swipe 0.5,0.3 → 0.5,0.9 → expect "focused:home"
 *     (the slide still moves along x when dismissed vertically; that is the interpolator, not the gesture)
 * 15. tap gestures-open-runtime (state resets: enabled:false), gestures-toggle-direction → expect "enabled:false direction:vertical";
 *     swipe 0.5,0.3 → 0.5,0.9 → expect "focused:runtime" (disabled wins over direction)
 */
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, createBlankStackNavigator, interpolate, LabContainer, Page, Probe, slide, SPEC, type Lab } from "./ui";

const Stack = createBlankStackNavigator();

/** Scale + fade driven by progress; pinch-in starts small, pinch-out starts big. */
const pinch = (direction: "pinch-in" | "pinch-out") => {
	const from = direction === "pinch-in" ? 0.6 : 1.6;
	return {
		gestureEnabled: true,
		gestureDirection: direction,
		transitionSpec: { open: SPEC, close: SPEC },
		screenStyleInterpolator: ({ progress }) => {
			"worklet";
			return {
				content: {
					style: {
						opacity: interpolate(progress, [0, 1], [0, 1], "clamp"),
						transform: [{ scale: interpolate(progress, [0, 1, 2], [from, 1, 0.94], "clamp") }],
					},
				},
			};
		},
	};
};

const focusedName = (state) => state.routes[state.index ?? state.routes.length - 1].name;

function FocusProbe({ state, children }) {
	return (
		<View style={{ flex: 1 }}>
			{children}
			<View pointerEvents="none" style={{ position: "absolute", left: 16, bottom: 40, backgroundColor: "#000a", borderRadius: 8, padding: 6 }}>
				<Probe testID="gestures-focused" value={`focused:${focusedName(state)}`} />
			</View>
		</View>
	);
}

const SCREENS = [
	["card", "Card ↔ ↕", "gestureDirection: [horizontal, vertical]"],
	["edge", "Edge only", "horizontal, area: edge (start within 50pt of the left)"],
	["area", "Top band 96", "[{vertical, area: 96}, horizontal]"],
	["pinch-in", "Pinch in", "gestureDirection: pinch-in (fingers together dismisses)"],
	["pinch-out", "Pinch out", "gestureDirection: pinch-out (fingers apart dismisses)"],
	["runtime", "Runtime", "gestureEnabled: false, toggled with setOptions"],
];

function Home({ navigation }) {
	return (
		<Page title="Gestures" testID="gestures-home">
			{SCREENS.map(([name, title]) => (
				<Button key={name} label={`Open ${title}`} testID={`gestures-open-${name}`} onPress={() => navigation.navigate(name)} />
			))}
		</Page>
	);
}

function Info({ route }) {
	const [, title, hint] = SCREENS.find(([name]) => name === route.name);
	return (
		<Page title={title} testID={`gestures-${route.name}`}>
			<Probe testID={`gestures-${route.name}-hint`} value={`config:${hint}`} />
		</Page>
	);
}

function Runtime({ navigation }) {
	const [enabled, setEnabled] = useState(false);
	const [direction, setDirection] = useState("horizontal");
	useEffect(() => {
		navigation.setOptions({ gestureEnabled: enabled, gestureDirection: direction });
	}, [navigation, enabled, direction]);
	return (
		<Page title="Runtime" testID="gestures-runtime">
			<Probe testID="gestures-runtime-options" value={`enabled:${enabled} direction:${direction}`} />
			<Button label={enabled ? "Disable gesture" : "Enable gesture"} testID="gestures-toggle-enabled" onPress={() => setEnabled((v) => !v)} />
			<Button
				label={`Switch to ${direction === "horizontal" ? "vertical" : "horizontal"}`}
				testID="gestures-toggle-direction"
				onPress={() => setDirection((d) => (d === "horizontal" ? "vertical" : "horizontal"))}
			/>
		</Page>
	);
}

function Component() {
	return (
		<LabContainer>
			<Stack.Navigator layout={({ state, children }) => <FocusProbe state={state}>{children}</FocusProbe>}>
				<Stack.Screen name="home" component={Home} />
				<Stack.Screen name="card" component={Info} options={slide("horizontal", { gestureDirection: ["horizontal", "vertical"] })} />
				<Stack.Screen name="edge" component={Info} options={slide("horizontal", { gestureDirection: { gesture: "horizontal", area: "edge" } })} />
				<Stack.Screen name="area" component={Info} options={slide("horizontal", { gestureDirection: [{ gesture: "vertical", area: 96 }, "horizontal"] })} />
				<Stack.Screen name="pinch-in" component={Info} options={pinch("pinch-in")} />
				<Stack.Screen name="pinch-out" component={Info} options={pinch("pinch-out")} />
				<Stack.Screen name="runtime" component={Runtime} options={slide("horizontal", { gestureEnabled: false })} />
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "gestures",
	title: "gestures",
	covers: "direction arrays, edge / px areas, pinch-in/out, runtime gestureEnabled + direction",
	Component,
};
