// @ts-nocheck
/**
 * stack: push / pop / replace / swipe-back on a three-screen blank stack with
 * one horizontal slide, plus the racy cases (push+push, push then pop, pop then
 * push) that interrupt a transition while it is still running.
 *
 * Testids: screens `stack-a|b|c` (titles `stack-a-title`...), push buttons
 * `stack-push-<target>`, other buttons `stack-<screen>-<action>`. `stack-route`
 * is rendered only by the focused screen: "route:B depth:2 stack:A>B".
 *
 * Argent loop (open harness://lab/stack):
 * 1. expect stack-route = "route:A depth:1 stack:A"
 * 2. tap stack-push-b → expect stack-b-title, stack-route "route:B depth:2 stack:A>B"
 * 3. tap stack-push-c → expect stack-c-title, "route:C depth:3 stack:A>B>C"
 * 4. tap stack-c-pop → expect stack-b-title, "route:B depth:2 stack:A>B"
 * 5. swipe right from 0.03,0.5 to 0.9,0.5 → expect stack-a-title, "route:A depth:1 stack:A"
 * 6. tap stack-push-b, then swipe right from 0.03,0.5 to 0.25,0.5 (release early)
 *    → expect B springs back: "route:B depth:2 stack:A>B"
 * 7. tap stack-b-replace-c → expect stack-c-title, "route:C depth:2 stack:A>C"
 * 8. tap stack-c-pop → "route:A depth:1 stack:A"
 * 9. tap stack-a-rapid (push B, push C 80ms later) → after settle "route:C depth:3 stack:A>B>C";
 *    screen C fully on screen (no half-slid B or C)
 * 10. tap stack-c-pop twice → "route:A depth:1 stack:A"
 * 11. tap stack-a-pop-during-push (push B, pop it 150ms later) → after settle
 *     "route:A depth:1 stack:A", A fully visible, B gone
 * 12. tap stack-push-b, tap stack-b-push-during-pop (pop B, push C 150ms later)
 *     → after settle "route:C depth:2 stack:A>C", C fully visible
 * 13. tap stack-c-pop → "route:A depth:1 stack:A"; repeat steps 9-13 three times
 *     to shake out timing; every settle must match the probe exactly.
 *
 * Fixed bar (over every screen, like a header): `stack-bar-pop` pops the top
 * route, `stack-bar-push` pushes the next one. It never moves, so e2e spam taps
 * its coordinates in one timed gesture (e2e/scenarios/stack-spam.sh).
 */
import { StackActions, useIsFocused, useNavigationState } from "@react-navigation/native";
import { Pressable, Text, View } from "react-native";
import { bridge } from "./bridge";
import { Button, createBlankStackNavigator, LabContainer, Page, Probe, slide, type Lab } from "./ui";

const Stack = createBlankStackNavigator();

const NEXT = { A: "B", B: "C", C: "A" };

/** Distinct solid colours for screen instances; none is the BLANK magenta. */
const INSTANCE_COLORS = ["#16a34a", "#dc2626", "#2563eb", "#ca8a04", "#7c3aed", "#0891b2", "#db2777", "#4d7c0f", "#c2410c", "#334155"];
const instanceColors = new Map<string, string>();
let nextColor = 0;
/**
 * A new instance takes the next colour in the cycle, skipping the colour of the screen below it: two
 * neighbours with the same colour have no edge between them for the analyzer to track (a push turned
 * back by a pop then read as a flicker).
 */
const instanceColor = (key: string, belowKey?: string) => {
	if (!instanceColors.has(key)) {
		const below = belowKey ? instanceColors.get(belowKey) : undefined;
		let color = INSTANCE_COLORS[nextColor++ % INSTANCE_COLORS.length];
		if (color === below) color = INSTANCE_COLORS[nextColor++ % INSTANCE_COLORS.length];
		instanceColors.set(key, color);
	}
	return instanceColors.get(key);
};

/**
 * Dispatch to the stack itself rather than "from" this screen: a screen's own
 * helpers stamp `source: route.key`, which makes a pop from a covered screen a
 * no-op and a push from a removed screen unreliable.
 */
const toStack = (navigation, action) => navigation.dispatch({ ...action, source: undefined, target: navigation.getState().key });

function RouteProbe() {
	const focused = useIsFocused();
	const summary = useNavigationState((state) => {
		const names = state.routes.map((r) => r.name);
		return `route:${names[state.index]} depth:${names.length} stack:${names.join(">")}`;
	});
	// Always laid out (hidden when unfocused) so a focus change doesn't shift the buttons below it.
	return (
		<View style={{ opacity: focused ? 1 : 0 }}>
			<Probe testID={focused ? "stack-route" : undefined} value={summary} />
		</View>
	);
}

function StackScreen({ navigation, route }) {
	const name = route.name;
	const id = name.toLowerCase();
	const next = NEXT[name];
	const after = (ms, action) => setTimeout(() => toStack(navigation, action), ms);
	const routes = navigation.getState()?.routes ?? [];
	const belowKey = routes[routes.findIndex((r) => r.key === route.key) - 1]?.key;
	return (
		// Each pushed instance gets its own colour (by route key): two screens with the same name crossing
		// each other (a push landing during a pop) stay distinguishable in recordings.
		<Page title={`Screen ${name}`} testID={`stack-${id}`} color={instanceColor(route.key, belowKey)}>
			<RouteProbe />
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
				<Button label={`push ${next}`} testID={`stack-push-${next.toLowerCase()}`} onPress={() => navigation.push(next)} />
				{navigation.canGoBack() ? <Button label="pop" testID={`stack-${id}-pop`} onPress={() => navigation.goBack()} /> : null}
				<Button label="replace with C" testID={`stack-${id}-replace-c`} onPress={() => navigation.replace("C")} />
				<Button
					label={`rapid: push ${next} + ${NEXT[next]}`}
					testID={`stack-${id}-rapid`}
					onPress={() => {
						navigation.push(next);
						after(80, StackActions.push(NEXT[next]));
					}}
				/>
				<Button
					label="pop during push"
					testID={`stack-${id}-pop-during-push`}
					onPress={() => {
						navigation.push(next);
						after(150, StackActions.pop());
					}}
				/>
				{navigation.canGoBack() ? (
					<Button
						label="push C during pop"
						testID={`stack-${id}-push-during-pop`}
						onPress={() => {
							navigation.goBack();
							after(150, StackActions.push("C"));
						}}
					/>
				) : null}
			</View>
		</Page>
	);
}

function BarButton({ label, testID, onPress }) {
	return (
		<Pressable testID={testID} accessibilityLabel={testID} onPress={onPress} style={{ flex: 1, height: 52, borderRadius: 14, backgroundColor: "#000c", alignItems: "center", justifyContent: "center" }}>
			<Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>{label}</Text>
		</Pressable>
	);
}

function Bar({ nav }) {
	return (
		<View pointerEvents="box-none" style={{ position: "absolute", left: 16, right: 16, bottom: 96, flexDirection: "row", gap: 12 }}>
			<BarButton label="◀ pop" testID="stack-bar-pop" onPress={() => {
					bridge.count("bar-pop");
					if (nav.canGoBack()) nav.dispatch(StackActions.pop());
					else bridge.count("bar-pop-ignored");
				}} />
			<BarButton label="push ▶" testID="stack-bar-push" onPress={() => {
					bridge.count("bar-push");
					nav.dispatch(StackActions.push(NEXT[nav.getCurrentRoute()?.name ?? "A"]));
				}} />
		</View>
	);
}

function Component() {
	return (
		<LabContainer overlay={(ref) => <Bar nav={ref} />}>
			<Stack.Navigator screenOptions={slide("horizontal")}>
				<Stack.Screen name="A" component={StackScreen} />
				<Stack.Screen name="B" component={StackScreen} />
				<Stack.Screen name="C" component={StackScreen} />
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "stack",
	title: "stack",
	covers: "push/pop/replace, swipe back, push+push, pop during push, push during pop",
	Component,
};
