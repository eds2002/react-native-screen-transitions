// @ts-nocheck
/**
 * chain: shared bounds over a longer flow. Screens A → B → C → D; each has a card (Boundary, its
 * own id per pair) that zooms into the next level, so every middle screen is the destination of one
 * pair and the source of the next. Mode: zoom, or bound (zoom({ target: "bound" }) onto a card at the
 * top of the opened screen); slow makes the spring slow enough to watch.
 *
 * Spam buttons (the harness's bounds-chain scenarios):
 *   ch-fast-push   (on A) push B, C, D each 90 ms after the last, mid-open
 *   ch-fast-pop    (on D) pop three times, 90 ms apart
 *   ch-pop-twice   pop, then pop again 50 ms later (the screen below closes mid-way through the first close)
 *
 * Argent loop (open harness://lab/chain):
 *  1. tap ch-card-a, ch-card-b, ch-card-c (settle between) → D; tap ch-back ×3 → back on A, each close
 *     landing on the card that opened it
 *  2. tap ch-fast-push, then ch-fast-pop → back on A with no snap or jump
 *  3. open to D, tap ch-pop-twice → back on B; C's card must not snap from expanded to its slot
 */
import { useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { Button, colorFor, createBlankStackNavigator, LabContainer, Transition, type Lab } from "./ui";

const LEVELS = ["A", "B", "C", "D"];
const Stack = createBlankStackNavigator();
const SLOW = { stiffness: 60, damping: 20, mass: 1.6, overshootClamping: true };
const pairId = (level: string) => {
	const i = LEVELS.indexOf(level);
	return i >= 0 && i < LEVELS.length - 1 ? `${LEVELS[i]}${LEVELS[i + 1]}`.toLowerCase() : null;
};

const routeId = (props) => {
	"worklet";
	return props.active?.route?.params?.id ?? props.current?.route?.params?.id ?? "";
};

const zoomOptions = (mode, slow) => ({
	gestureEnabled: true,
	gestureDirection: ["bidirectional", "pinch-in"],
	transitionSpec: slow ? { open: SLOW, close: SLOW } : Transition.Specs.Zoom,
	screenStyleInterpolator: (props) => {
		"worklet";
		const id = routeId(props);
		if (!id) return {};
		return props.bounds(id).navigation.zoom(mode === "bound" ? { target: "bound" } : undefined);
	},
});

function BarButton({ label, testID, onPress }) {
	return (
		<Pressable testID={testID} accessibilityLabel={testID} onPress={onPress} style={{ backgroundColor: "#000c", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 }}>
			<Text style={{ color: "white", fontWeight: "800" }}>{label}</Text>
		</Pressable>
	);
}

function Level({ navigation, route }) {
	const name = route.name;
	const { width } = useWindowDimensions();
	const { mode = "zoom", slow = false } = route.params ?? {};
	const [localMode, setMode] = useState(mode);
	const [localSlow, setSlow] = useState(slow);
	const isRoot = name === "A";
	const m = isRoot ? localMode : mode;
	const s = isRoot ? localSlow : slow;
	const next = LEVELS[LEVELS.indexOf(name) + 1];
	const nextId = pairId(name);
	const incomingId = route.params?.id;
	const cardW = (width - 40 - 10) / 2;
	const push = (to, id) => navigation.push(to, { id, mode: m, slow: s });
	const later = (ms, fn) => setTimeout(fn, ms);

	return (
		<View style={{ flex: 1, backgroundColor: isRoot ? "#111827" : "#0b0b0f", paddingTop: 110, paddingHorizontal: 20, gap: 12 }}>
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
				{!isRoot ? <BarButton label="Back" testID="ch-back" onPress={() => navigation.goBack()} /> : null}
				{!isRoot ? (
					<BarButton
						label="pop twice"
						testID="ch-pop-twice"
						onPress={() => {
							navigation.goBack();
							later(50, () => navigation.goBack());
						}}
					/>
				) : null}
				{name === "D" ? (
					<BarButton
						label="fast pop"
						testID="ch-fast-pop"
						onPress={() => {
							navigation.goBack();
							later(90, () => navigation.goBack());
							later(180, () => navigation.goBack());
						}}
					/>
				) : null}
				{isRoot ? (
					<>
						{["zoom", "bound"].map((x) => (
							<Button key={x} label={x === m ? `• ${x}` : x} testID={`ch-mode-${x}`} onPress={() => setMode(x)} />
						))}
						<Button label={s ? "• slow" : "slow"} testID="ch-slow" onPress={() => setSlow(!s)} />
						<Button
							label="fast push"
							testID="ch-fast-push"
							onPress={() => {
								push("B", "ab");
								later(90, () => navigation.push("C", { id: "bc", mode: m, slow: s }));
								later(180, () => navigation.push("D", { id: "cd", mode: m, slow: s }));
							}}
						/>
					</>
				) : null}
			</View>
			<Text style={{ color: "white", fontSize: 34, fontWeight: "800" }}>{name}</Text>
			{incomingId && m === "bound" ? (
				<Transition.Boundary id={incomingId} style={{ height: (width - 40) * 0.5, borderRadius: 24, backgroundColor: colorFor(`ch${incomingId}`) }} />
			) : null}
			<View style={{ flex: 1 }} />
			{next && nextId ? (
				<Transition.Boundary
					id={nextId}
					testID={`ch-card-${name.toLowerCase()}`}
					accessibilityLabel={`ch-card-${name.toLowerCase()}`}
					onPress={() => push(next, nextId)}
					style={{ width: cardW, height: cardW * 0.75, borderRadius: 20, backgroundColor: colorFor(`ch${nextId}`), justifyContent: "flex-end", padding: 14, marginBottom: 140 }}
				>
					<Text style={{ color: "white", fontSize: 24, fontWeight: "800" }}>
						{name} → {next}
					</Text>
				</Transition.Boundary>
			) : null}
		</View>
	);
}

function Component() {
	return (
		<LabContainer>
			<Stack.Navigator>
				{LEVELS.map((name, i) => (
					<Stack.Screen key={name} name={name} component={Level} options={i === 0 ? undefined : ({ route }) => zoomOptions(route.params?.mode, route.params?.slow)} />
				))}
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "chain",
	title: "chain",
	covers: "Shared bounds over A → B → C → D: zoom / zoom-to-bound, fast push and pop chains, pop twice",
	Component,
};
