// @ts-nocheck
/**
 * scroll: handoff between a Transition.ScrollView and the screen's gesture.
 * - list: vertical slide holding a long Transition.ScrollView; ↓ dismisses only
 *   when the list is at scrollY = 0, otherwise the list scrolls.
 * - sheet: sheet([0.4, 0.7, 1]) holding a long Transition.ScrollView, with a
 *   button that flips sheetScrollGestureBehavior (setOptions) between
 *   "expand-and-collapse" (↑ from the list at top expands) and "collapse-only"
 *   (↑ from the list always scrolls; expand only from the header deadspace).
 *
 * Probes: `scroll-focused` ("focused:<route>", bottom-left overlay),
 * `scroll-list-offset` / `scroll-sheet-offset` ("offset:<y>"), `scroll-sheet-snap`
 * ("snap:<index>"), `scroll-sheet-behavior` ("behavior:<value>"). Regions to swipe
 * in: `scroll-sheet-header` (deadspace) and `scroll-sheet-list`; read their
 * frames, the sheet top moves with the snap (y 0.6 / 0.3 / 0 at snap 0 / 1 / 2).
 *
 * Argent loop:
 *  List
 *  1. tap open-scroll → expect "focused:home"; tap scroll-open-list → expect "focused:list", "offset:0"
 *  2. swipe 0.5,0.4 → 0.5,0.9 → expect "focused:home" (at top: dismisses)
 *  3. tap scroll-open-list; swipe 0.5,0.85 → 0.5,0.35 → expect offset > 0, "focused:list"
 *  4. swipe 0.5,0.4 → 0.5,0.6 (short) → expect offset smaller, still "focused:list" (scrolled: no dismiss)
 *  5. swipe 0.5,0.4 → 0.5,0.9 until "offset:0" (still "focused:list"); then swipe 0.5,0.4 → 0.5,0.9 → expect "focused:home"
 *  Sheet, expand-and-collapse
 *  6. tap scroll-open-sheet → expect "focused:sheet", "snap:0", "behavior:expand-and-collapse", "offset:0"
 *  7. swipe up inside scroll-sheet-list (bottom of list → 30% higher) → expect "snap:1", "offset:0"
 *  8. repeat → expect "snap:2"; repeat → expect offset > 0, "snap:2" (fully open: list scrolls)
 *  9. swipe down inside the list until "offset:0" → expect "snap:2"; swipe down again → expect "snap:1"
 *  Sheet, collapse-only
 * 10. tap scroll-toggle-behavior → expect "behavior:collapse-only"
 * 11. swipe down inside the list → expect "snap:0" (collapse at top still works)
 * 12. swipe up inside the list → expect offset > 0, "snap:0" (never expands from the list)
 * 13. swipe down inside the list until "offset:0", then swipe up from scroll-sheet-header → expect "snap:1" (deadspace expands)
 * 14. swipe down inside the list twice → expect "snap:0", then "focused:home" (dismiss from the lowest snap)
 */
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useAnimatedReaction, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScreenAnimation } from "react-native-screen-transitions";
import { scheduleOnRN } from "react-native-worklets";
import { Button, createBlankStackNavigator, LabContainer, Page, Probe, sheet, slide, Transition, type Lab } from "./ui";

const Stack = createBlankStackNavigator();
const ROWS = Array.from({ length: 40 }, (_, i) => `Row ${i + 1}`);
const BEHAVIORS = ["expand-and-collapse", "collapse-only"];

function FocusProbe({ state, children }) {
	return (
		<View style={{ flex: 1 }}>
			{children}
			<View pointerEvents="none" style={{ position: "absolute", left: 16, bottom: 40, backgroundColor: "#000a", borderRadius: 8, padding: 6 }}>
				<Probe testID="scroll-focused" value={`focused:${state.routes[state.index ?? state.routes.length - 1].name}`} />
			</View>
		</View>
	);
}

/** Scroll offset (rounded) mirrored into React state for the probe. */
function useScrollOffset() {
	const [offset, setOffset] = useState(0);
	const last = useSharedValue(0);
	const onScroll = useAnimatedScrollHandler((event) => {
		const y = Math.round(event.contentOffset.y);
		if (y === last.value) return;
		last.value = y;
		scheduleOnRN(setOffset, y);
	});
	return [offset, onScroll];
}

/** Target snap index of this screen mirrored into React state. */
function useSnapIndex() {
	const animation = useScreenAnimation();
	const [snap, setSnap] = useState(-1);
	useAnimatedReaction(
		() => animation.value?.current?.snapIndex ?? -1,
		(next, prev) => {
			if (next !== prev) scheduleOnRN(setSnap, next);
		},
	);
	return snap;
}

function Rows({ testID, onScroll }) {
	return (
		<Transition.ScrollView testID={testID} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 8 }} onScroll={onScroll}>
			{ROWS.map((row) => (
				<View key={row} style={{ backgroundColor: "#fff2", borderRadius: 10, padding: 14 }}>
					<Text style={{ color: "white", fontWeight: "600" }}>{row}</Text>
				</View>
			))}
		</Transition.ScrollView>
	);
}

function Home({ navigation }) {
	return (
		<Page title="Scroll" testID="scroll-home">
			<Button label="Open list (vertical slide)" testID="scroll-open-list" onPress={() => navigation.navigate("list")} />
			<Button label="Open sheet [0.4, 0.7, 1]" testID="scroll-open-sheet" onPress={() => navigation.navigate("sheet")} />
		</Page>
	);
}

function List() {
	const insets = useSafeAreaInsets();
	const [offset, onScroll] = useScrollOffset();
	return (
		<View testID="scroll-list" style={{ flex: 1, backgroundColor: "#16a34a" }}>
			<View style={{ paddingTop: insets.top + 56, paddingHorizontal: 20, gap: 6 }}>
				<Text testID="scroll-list-title" style={{ color: "white", fontSize: 34, fontWeight: "800" }}>
					List
				</Text>
				<Probe testID="scroll-list-offset" value={`offset:${offset}`} />
			</View>
			<Rows testID="scroll-list-scroll" onScroll={onScroll} />
		</View>
	);
}

function Sheet({ navigation }) {
	const [behavior, setBehavior] = useState(BEHAVIORS[0]);
	const [offset, onScroll] = useScrollOffset();
	const snap = useSnapIndex();
	useEffect(() => {
		navigation.setOptions({ sheetScrollGestureBehavior: behavior });
	}, [navigation, behavior]);
	return (
		<View testID="scroll-sheet" style={{ flex: 1, backgroundColor: "#9333ea", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
			<View testID="scroll-sheet-header" style={{ padding: 16, gap: 6 }}>
				<View style={{ alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: "#fff8" }} />
				<Text testID="scroll-sheet-title" style={{ color: "white", fontSize: 22, fontWeight: "800" }}>
					Sheet
				</Text>
				<Button label="Toggle scroll behavior" testID="scroll-toggle-behavior" onPress={() => setBehavior((b) => BEHAVIORS[(BEHAVIORS.indexOf(b) + 1) % 2])} />
				<Probe testID="scroll-sheet-behavior" value={`behavior:${behavior}`} />
				<Probe testID="scroll-sheet-snap" value={`snap:${snap}`} />
				<Probe testID="scroll-sheet-offset" value={`offset:${offset}`} />
			</View>
			<Rows testID="scroll-sheet-list" onScroll={onScroll} />
		</View>
	);
}

function Component() {
	return (
		<LabContainer>
			<Stack.Navigator layout={({ state, children }) => <FocusProbe state={state}>{children}</FocusProbe>}>
				<Stack.Screen name="home" component={Home} />
				<Stack.Screen name="list" component={List} options={slide("vertical")} />
				<Stack.Screen name="sheet" component={Sheet} options={sheet([0.4, 0.7, 1], { sheetScrollGestureBehavior: BEHAVIORS[0] })} />
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "scroll",
	title: "scroll",
	covers: "Transition.ScrollView boundary handoff, sheetScrollGestureBehavior expand-and-collapse / collapse-only",
	Component,
};
