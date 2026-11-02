// @ts-nocheck
/**
 * backdrop: what a tap outside a sheet does, for each backdropBehavior.
 * The home screen is one big Pressable underlay that counts taps, so every
 * behavior is visible as "did the underlay count, did the sheet move or close".
 * Each sheet counts taps on its own content (it must stay interactive).
 *
 * Sheets: dismiss / block / passthrough use snap [0.5]; collapse uses
 * [0.5, 0.75] opening at index 1. Sheet top is at y≈0.5 (collapse: y≈0.25).
 *
 * Testids: home `backdrop-home`, underlay `backdrop-underlay`, probe
 * `backdrop-underlay-count` ("underlay-count:N"), `backdrop-open-<kind>`.
 * Per sheet: `backdrop-<kind>`, `backdrop-<kind>-index` ("snap-index:N"),
 * `backdrop-<kind>-tap`, `backdrop-<kind>-taps` ("taps:N"), `backdrop-<kind>-close`.
 *
 * Argent loop (open harness://lab/backdrop); "backdrop point" = 0.5,0.42 (nothing but underlay there):
 * 1. tap 0.5,0.42 → backdrop-underlay-count "underlay-count:1"
 * 2. tap backdrop-open-dismiss → backdrop-dismiss-index "snap-index:0"; tap backdrop-dismiss-tap
 *    → backdrop-dismiss-taps "taps:1"; tap 0.5,0.42 → sheet closes, backdrop-home-title visible,
 *    count still "underlay-count:1"
 * 3. tap backdrop-open-block → tap 0.5,0.42 → sheet stays, "snap-index:0", count still 1;
 *    tap backdrop-block-tap → "taps:1"; tap backdrop-block-close → home
 * 4. tap backdrop-open-passthrough → tap 0.5,0.42 → sheet stays AND "underlay-count:2";
 *    tap backdrop-passthrough-tap → "taps:1" and count still 2 (content does not leak);
 *    swipe down from 0.5,0.53 to 0.5,0.98 → home
 * 5. tap backdrop-open-collapse → backdrop-collapse-index "snap-index:1";
 *    tap 0.5,0.12 → "snap-index:0" (collapsed one step, count unchanged);
 *    tap 0.5,0.42 → sheet dismissed (collapse at the lowest point dismisses), count unchanged
 * 6. tap 0.5,0.42 → "underlay-count:3" (nothing left covering the home screen)
 */
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Row, SheetBody, SnapIndexProbe } from "./sheet";
import { Button, createBlankStackNavigator, LabContainer, Probe, sheet, type Lab } from "./ui";

const Stack = createBlankStackNavigator();

const KINDS = ["dismiss", "collapse", "block", "passthrough"];

const optionsFor = (kind) =>
	kind === "collapse"
		? sheet([0.5, 0.75], { initialSnapIndex: 1, backdropBehavior: "collapse" })
		: sheet([0.5], { backdropBehavior: kind });

function Home({ navigation }) {
	const insets = useSafeAreaInsets();
	const [count, setCount] = useState(0);
	return (
		<View testID="backdrop-home" style={{ flex: 1, backgroundColor: "#0891b2" }}>
			<Pressable testID="backdrop-underlay" accessibilityLabel="backdrop-underlay" onPress={() => setCount((n) => n + 1)} style={StyleSheet.absoluteFill}>
				<Text style={{ position: "absolute", bottom: insets.bottom + 24, alignSelf: "center", color: "#fff8", fontWeight: "700" }}>underlay: tap anywhere</Text>
			</Pressable>
			<View pointerEvents="box-none" style={{ paddingTop: insets.top + 56, paddingHorizontal: 20, gap: 10 }}>
				<Text testID="backdrop-home-title" style={{ color: "white", fontSize: 34, fontWeight: "800" }} pointerEvents="none">
					Backdrop
				</Text>
				<Probe testID="backdrop-underlay-count" value={`underlay-count:${count}`} />
				<Row>
					{KINDS.map((kind) => (
						<Button key={kind} label={kind} testID={`backdrop-open-${kind}`} onPress={() => navigation.push(kind)} />
					))}
				</Row>
			</View>
		</View>
	);
}

function BehaviorSheet({ navigation, route }) {
	const kind = route.name;
	const [taps, setTaps] = useState(0);
	return (
		<SheetBody testID={`backdrop-${kind}`} title={`${kind} backdrop`}>
			<SnapIndexProbe testID={`backdrop-${kind}-index`} />
			<Probe testID={`backdrop-${kind}-taps`} value={`taps:${taps}`} />
			<Row>
				<Button label="tap sheet" testID={`backdrop-${kind}-tap`} onPress={() => setTaps((n) => n + 1)} />
				<Button label="close" testID={`backdrop-${kind}-close`} onPress={() => navigation.goBack()} />
			</Row>
		</SheetBody>
	);
}

function Component() {
	return (
		<LabContainer>
			<Stack.Navigator>
				<Stack.Screen name="Home" component={Home} />
				{KINDS.map((kind) => (
					<Stack.Screen key={kind} name={kind} component={BehaviorSheet} options={optionsFor(kind)} />
				))}
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "backdrop",
	title: "backdrop",
	covers: "backdropBehavior dismiss / collapse / block / passthrough over a tappable underlay",
	Component,
};
