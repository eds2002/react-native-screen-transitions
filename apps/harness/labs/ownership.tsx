// @ts-nocheck
/**
 * ownership: which stack owns a swipe when stacks are nested. One setup covers
 * the e2e GestureInfo cases (apps/e2e/app/gestures/*):
 *
 *   root
 *   ├─ home
 *   └─ L1 (vertical slide) ─ nested stack
 *      ├─ index
 *      ├─ leafNone        (slides in, no gesture)       → inherits L1's ↓
 *      ├─ leafHorizontal  (horizontal slide)            → owns →, inherits L1's ↓
 *      └─ L2 (horizontal slide) ─ nested stack
 *         ├─ index                                      → → is L2's, ↓ falls back to L1
 *         ├─ leafVertical (vertical slide)              → shadows L1's ↓, inherits L2's →
 *         └─ sheet (vertical, snaps [0.5, 0.8])         → owns ↓ and ↑, inherits L2's →
 *
 * Probe `ownership-focused` ("focused:<path>", e.g. "focused:L1/L2/sheet") sits
 * bottom-left over everything and passes touches through. The sheet also shows
 * `ownership-sheet-snap` ("snap:<index>"). Coordinates are normalized (x,y).
 *
 * Argent loop:
 *  1. tap open-ownership → expect "focused:home"; tap ownership-open-l1 → expect "focused:L1/index"
 *  2. swipe 0.5,0.3 → 0.5,0.9 on L1 index → expect "focused:home" (L1 owns ↓)
 *  Inheritance
 *  3. tap ownership-open-l1, ownership-open-leaf-none → expect "focused:L1/leafNone"
 *  4. swipe 0.1,0.5 → 0.9,0.5 and 0.5,0.8 → 0.5,0.2 → expect "focused:L1/leafNone" (nobody owns → or ↑)
 *  5. swipe 0.5,0.3 → 0.5,0.9 → expect "focused:home" (↓ inherited: the whole L1 stack goes)
 *  Different axis
 *  6. tap ownership-open-l1, ownership-open-leaf-horizontal; swipe 0.1,0.5 → 0.9,0.5 → expect "focused:L1/index" (leaf only)
 *  7. tap ownership-open-leaf-horizontal; swipe 0.5,0.3 → 0.5,0.9 → expect "focused:home" (↓ is L1's)
 *  Shadowing / deep nesting
 *  8. tap ownership-open-l1, ownership-open-l2 → expect "focused:L1/L2/index";
 *     tap ownership-open-leaf-vertical → expect "focused:L1/L2/leafVertical"
 *  9. swipe 0.1,0.5 → 0.9,0.5 → expect "focused:L1/index" (→ inherited from L2: L2 dismissed with the leaf)
 *  Claim fallback (repeated swipe-downs peel one owner at a time)
 * 10. tap ownership-open-l2, ownership-open-leaf-vertical; swipe 0.5,0.3 → 0.5,0.9 → expect "focused:L1/L2/index" (leaf only)
 * 11. swipe 0.5,0.3 → 0.5,0.9 → expect "focused:home" (claim fell back to L1, not stuck on the gone leaf)
 *  Nested sheet (sheet covers y 0.5..1 at snap 0, y 0.2..1 at snap 1)
 * 12. tap ownership-open-l1, ownership-open-l2, ownership-open-sheet → expect "focused:L1/L2/sheet", "snap:0"
 * 13. swipe 0.5,0.65 → 0.5,0.98 → expect "focused:L1/L2/index" (sheet only; it shadows L1's ↓)
 * 14. tap ownership-open-sheet; swipe 0.1,0.75 → 0.9,0.75 → expect "focused:L1/index" (→ inherited from L2)
 * 15. tap ownership-open-l2, ownership-open-sheet; swipe 0.5,0.9 → 0.5,0.4 → expect "snap:1", "focused:L1/L2/sheet"
 *     SUSPECTED CRASH here (expanding a nested sheet): record app state / red box / crash log if it dies.
 * 16. swipe 0.5,0.35 → 0.5,0.65 → expect "snap:0"; swipe 0.5,0.65 → 0.5,0.98 → expect "focused:L1/L2/index"
 */
import { useState } from "react";
import { View } from "react-native";
import { useAnimatedReaction } from "react-native-reanimated";
import { useScreenAnimation } from "react-native-screen-transitions";
import { scheduleOnRN } from "react-native-worklets";
import { Button, createBlankStackNavigator, LabContainer, Page, Probe, sheet, slide, type Lab } from "./ui";

const Root = createBlankStackNavigator();
const L1Stack = createBlankStackNavigator();
const L2Stack = createBlankStackNavigator();

/** Vertical slide presentation without any gesture: leafNone must inherit. */
const { gestureEnabled: _enabled, gestureDirection: _direction, ...noGesture } = slide("vertical");

/** Focused route names from the root down, e.g. "L1/L2/sheet". */
const pathOf = (state) => {
	const route = state.routes[state.index ?? state.routes.length - 1];
	return route.state ? `${route.name}/${pathOf(route.state)}` : route.name;
};

function FocusProbe({ state, children }) {
	return (
		<View style={{ flex: 1 }}>
			{children}
			<View pointerEvents="none" style={{ position: "absolute", left: 16, bottom: 40, backgroundColor: "#000a", borderRadius: 8, padding: 6 }}>
				<Probe testID="ownership-focused" value={`focused:${pathOf(state)}`} />
			</View>
		</View>
	);
}

/** A page with an expectations line and buttons that navigate within its own stack. */
const screen = (title: string, id: string, expect: string, links: [string, string, string][] = []) =>
	function Screen({ navigation }) {
		return (
			<Page title={title} testID={`ownership-${id}`}>
				<Probe testID={`ownership-${id}-expect`} value={`expect:${expect}`} />
				{links.map(([label, action, route]) => (
					<Button key={action} label={label} testID={`ownership-${action}`} onPress={() => navigation.navigate(route)} />
				))}
			</Page>
		);
	};

const Home = screen("Ownership", "home", "open L1", [["Open L1 (vertical)", "open-l1", "L1"]]);
const L1Index = screen("L1 index", "l1-index", "↓ dismisses L1", [
	["Open leaf: no gesture", "open-leaf-none", "leafNone"],
	["Open leaf: horizontal", "open-leaf-horizontal", "leafHorizontal"],
	["Open L2 (horizontal)", "open-l2", "L2"],
]);
const LeafNone = screen("Leaf none", "leaf-none", "↓ dismisses L1 (inherited), → ↑ nothing");
const LeafHorizontal = screen("Leaf horizontal", "leaf-horizontal", "→ dismisses leaf, ↓ dismisses L1");
const L2Index = screen("L2 index", "l2-index", "→ dismisses L2, ↓ dismisses L1 (fallback)", [
	["Open leaf: vertical", "open-leaf-vertical", "leafVertical"],
	["Open sheet [0.5, 0.8]", "open-sheet", "sheet"],
]);
const LeafVertical = screen("Leaf vertical", "leaf-vertical", "↓ dismisses leaf only, → dismisses L2");

function Sheet() {
	const animation = useScreenAnimation();
	const [snap, setSnap] = useState(-1);
	useAnimatedReaction(
		() => animation.value?.current?.snapIndex ?? -1,
		(next, prev) => {
			if (next !== prev) scheduleOnRN(setSnap, next);
		},
	);
	return (
		<View testID="ownership-sheet" style={{ flex: 1, backgroundColor: "#0891b2", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 8 }}>
			<Probe testID="ownership-sheet-title" value="Nested sheet" />
			<Probe testID="ownership-sheet-snap" value={`snap:${snap}`} />
			<Probe testID="ownership-sheet-expect" value="expect:↓ collapses/dismisses sheet only, ↑ expands, → dismisses L2" />
		</View>
	);
}

function L2Navigator() {
	return (
		<L2Stack.Navigator>
			<L2Stack.Screen name="index" component={L2Index} />
			<L2Stack.Screen name="leafVertical" component={LeafVertical} options={slide("vertical")} />
			<L2Stack.Screen name="sheet" component={Sheet} options={sheet([0.5, 0.8])} />
		</L2Stack.Navigator>
	);
}

function L1Navigator() {
	return (
		<L1Stack.Navigator>
			<L1Stack.Screen name="index" component={L1Index} />
			<L1Stack.Screen name="leafNone" component={LeafNone} options={noGesture} />
			<L1Stack.Screen name="leafHorizontal" component={LeafHorizontal} options={slide("horizontal")} />
			<L1Stack.Screen name="L2" component={L2Navigator} options={slide("horizontal")} />
		</L1Stack.Navigator>
	);
}

function Component() {
	return (
		<LabContainer>
			<Root.Navigator layout={({ state, children }) => <FocusProbe state={state}>{children}</FocusProbe>}>
				<Root.Screen name="home" component={Home} />
				<Root.Screen name="L1" component={L1Navigator} options={slide("vertical")} />
			</Root.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "ownership",
	title: "ownership",
	covers: "nested gesture ownership: inheritance, axes, shadowing, claim fallback, nested sheet",
	Component,
};
