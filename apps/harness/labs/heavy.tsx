// @ts-nocheck
/**
 * heavy: a screen that is slow to render the first time. B burns <cost> ms in
 * its first render (JS thread) and mounts a few hundred views (UI thread), so
 * the open transition has to wait for B's first frame: if the animation's clock
 * starts at the push, A slides away with nothing over it and B appears part-way
 * through the transition instead of sliding in from the edge.
 *
 * Testids: screens `heavy-a`, `heavy-b`; push buttons `heavy-push-<cost>`
 * (0, 150, 400, 800); `heavy-b-pop`.
 *
 * Argent loop (open harness://lab/heavy):
 * 1. tap heavy-push-400 → expect heavy-b after settle; the recording must show
 *    B entering from the right edge, never A moving with nothing over it
 * 2. tap heavy-b-pop → heavy-a
 */
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, createBlankStackNavigator, LabContainer, Page, Probe, slide, type Lab } from "./ui";

const Stack = createBlankStackNavigator();
const COSTS = [0, 150, 400, 800];

function Home({ navigation }) {
	return (
		<Page title="Heavy A" testID="heavy-a" color="#15803d">
			<Probe testID="heavy-a-note" value="B burns <cost> ms on first render" />
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
				{COSTS.map((cost) => (
					<Button key={cost} label={`push B (${cost} ms)`} testID={`heavy-push-${cost}`} onPress={() => navigation.push("B", { cost })} />
				))}
			</View>
		</Page>
	);
}

const burn = (ms: number) => {
	const end = Date.now() + ms;
	let x = 0;
	while (Date.now() < end) x += Math.sqrt(x + 1);
	return x;
};

function Heavy({ navigation, route }) {
	const cost = route.params?.cost ?? 0;
	// Only the first render pays.
	const [spent] = useState(() => {
		const start = Date.now();
		burn(cost);
		return Date.now() - start;
	});
	const cells = cost > 0 ? 320 : 0;
	return (
		<Page title="Heavy B" testID="heavy-b" color="#b91c1c">
			<Probe testID="heavy-b-cost" value={`cost:${cost} spent:${spent}`} />
			<Button label="pop" testID="heavy-b-pop" onPress={() => navigation.goBack()} />
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
				{Array.from({ length: cells }, (_, i) => (
					<View key={i} style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: i % 2 ? "#7f1d1d" : "#991b1b" }}>
						<Text style={{ fontSize: 1 }}> </Text>
					</View>
				))}
			</View>
		</Page>
	);
}

function Component() {
	return (
		<LabContainer>
			<Stack.Navigator screenOptions={slide("horizontal")}>
				<Stack.Screen name="A" component={Home} />
				<Stack.Screen name="B" component={Heavy} />
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "heavy",
	title: "heavy",
	covers: "open transition waits for a slow first render (B appears from the edge, not part-way)",
	Component,
};
