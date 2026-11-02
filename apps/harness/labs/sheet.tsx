// @ts-nocheck
/**
 * sheet: snap points on a blank-stack screen. Programmatic snapTo, gesture
 * expand / collapse / dismiss, runtime setOptions toggles for
 * gestureSnapLocked and sheetSnapBehavior, and an "auto" snap point that
 * follows measured content height. The underlying home screen counts taps so
 * you can see when it is (and is not) reachable.
 *
 * Testids: home `sheet-home`, `sheet-tap`, probe `sheet-home-taps` ("taps:N").
 * Snap sheet (0.4 / 0.7 / 1): `sheet-snap`, `sheet-snap-index` ("snap-index:N"),
 * `sheet-snap-options` ("locked:false behavior:continuous"), `sheet-snap-to-0|1|2`,
 * `sheet-toggle-lock`, `sheet-toggle-behavior`, `sheet-snap-close`.
 * Auto sheet (auto / 1): `sheet-auto`, `sheet-auto-index`, `sheet-auto-height`
 * ("content-height:N", library-measured), `sheet-auto-toggle`,
 * `sheet-auto-snap-auto`, `sheet-auto-snap-full`, `sheet-auto-close`.
 *
 * Argent loop (open harness://lab/sheet):
 * 1. tap sheet-tap twice → sheet-home-taps "taps:2"
 * 2. tap sheet-open-snap → expect sheet-snap-title, sheet-snap-index "snap-index:0" (sheet top ≈ y 0.6)
 * 3. tap sheet-snap-to-2 → "snap-index:2"; tap sheet-snap-to-1 → "snap-index:1"; tap sheet-snap-to-0 → "snap-index:0"
 * 4. swipe up from 0.5,0.63 to 0.5,0.33 → "snap-index:1" (sheet top ≈ y 0.3)
 * 5. swipe up from 0.5,0.33 to 0.5,0.05 → "snap-index:2"
 * 6. swipe down from 0.5,0.03 to 0.5,0.35 → "snap-index:1"
 * 7. tap sheet-toggle-lock → sheet-snap-options "locked:true ..."; swipe up from 0.5,0.33 to 0.5,0.05
 *    → still "snap-index:1"; tap sheet-snap-to-2 → "snap-index:2" (snapTo ignores the lock)
 * 8. tap sheet-toggle-lock → "locked:false ..."; tap sheet-snap-to-0
 * 9. tap sheet-toggle-behavior → "behavior:step"; fast swipe up from 0.5,0.63 to 0.5,0.05
 *    → "snap-index:1" (one interval per drag); tap sheet-toggle-behavior → "behavior:continuous",
 *    tap sheet-snap-to-0, repeat the fast swipe → "snap-index:2"
 * 10. tap sheet-snap-to-0, swipe down from 0.5,0.63 to 0.5,0.98 → sheet dismissed, sheet-home-title visible;
 *     tap sheet-tap → "taps:3" (home is interactive again)
 * 11. tap sheet-open-auto → sheet-auto-index "snap-index:0", note sheet-auto-height H
 * 12. tap sheet-auto-toggle → sheet-auto-height ≈ H+110, still "snap-index:0", sheet grew upward
 * 13. tap sheet-auto-snap-full → "snap-index:1"; tap sheet-auto-snap-auto → "snap-index:0"
 * 14. tap sheet-auto-toggle → height back to H; tap sheet-auto-close → sheet-home-title
 */
import { useEffect, useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import { useAnimatedReaction } from "react-native-reanimated";
import { snapTo, useScreenAnimation } from "react-native-screen-transitions";
import { scheduleOnRN } from "react-native-worklets";
import { Button, createBlankStackNavigator, LabContainer, Page, Probe, sheet, type Lab } from "./ui";

const Stack = createBlankStackNavigator();

/** Probe for a value read on the UI thread from this screen's animation state (`read` must be a worklet). */
export function AnimationProbe({ testID, label, read }) {
	const animation = useScreenAnimation();
	const [value, setValue] = useState("-");
	useAnimatedReaction(
		() => read(animation.value),
		(current, previous) => {
			if (current !== previous) scheduleOnRN(setValue, String(current));
		},
	);
	return <Probe testID={testID} value={`${label}:${value}`} />;
}

const readSnapIndex = (a) => {
	"worklet";
	return a.current.snapIndex;
};
const readContentHeight = (a) => {
	"worklet";
	return Math.round(a.current.layouts.content?.height ?? 0);
};

export const SnapIndexProbe = ({ testID }) => <AnimationProbe testID={testID} label="snap-index" read={readSnapIndex} />;

/** Sheet content: anchored at the top of the screen, full height unless `auto`. */
export function SheetBody({ testID, title, auto, children }) {
	const { height } = useWindowDimensions();
	return (
		<View testID={testID} style={{ backgroundColor: "#111827", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, gap: 10, minHeight: auto ? undefined : height }}>
			<View style={{ alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: "#fff6" }} />
			<Text testID={`${testID}-title`} style={{ color: "white", fontSize: 24, fontWeight: "800" }}>
				{title}
			</Text>
			{children}
		</View>
	);
}

export const Row = ({ children }) => <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>;

function Home({ navigation }) {
	const [taps, setTaps] = useState(0);
	return (
		<Page title="Sheet home" testID="sheet-home">
			<Probe testID="sheet-home-taps" value={`taps:${taps}`} />
			<Row>
				<Button label="tap me" testID="sheet-tap" onPress={() => setTaps((n) => n + 1)} />
				<Button label="open snap sheet" testID="sheet-open-snap" onPress={() => navigation.push("Snap")} />
				<Button label="open auto sheet" testID="sheet-open-auto" onPress={() => navigation.push("Auto")} />
			</Row>
		</Page>
	);
}

function SnapSheet({ navigation }) {
	const [locked, setLocked] = useState(false);
	const [behavior, setBehavior] = useState("continuous");
	useEffect(() => {
		navigation.setOptions({ gestureSnapLocked: locked, sheetSnapBehavior: behavior });
	}, [navigation, locked, behavior]);
	return (
		<SheetBody testID="sheet-snap" title="Snap sheet">
			<SnapIndexProbe testID="sheet-snap-index" />
			<Probe testID="sheet-snap-options" value={`locked:${locked} behavior:${behavior}`} />
			<Row>
				{[0, 1, 2].map((i) => (
					<Button key={i} label={`snap ${i}`} testID={`sheet-snap-to-${i}`} onPress={() => snapTo(i)} />
				))}
			</Row>
			<Row>
				<Button label={`lock: ${locked ? "on" : "off"}`} testID="sheet-toggle-lock" onPress={() => setLocked((v) => !v)} />
				<Button label={`behavior: ${behavior}`} testID="sheet-toggle-behavior" onPress={() => setBehavior((b) => (b === "step" ? "continuous" : "step"))} />
				<Button label="close" testID="sheet-snap-close" onPress={() => navigation.goBack()} />
			</Row>
		</SheetBody>
	);
}

function AutoSheet({ navigation }) {
	const [tall, setTall] = useState(false);
	return (
		<SheetBody testID="sheet-auto" title="Auto sheet" auto>
			<SnapIndexProbe testID="sheet-auto-index" />
			<AnimationProbe testID="sheet-auto-height" label="content-height" read={readContentHeight} />
			<View testID="sheet-auto-box" style={{ height: tall ? 220 : 110, borderRadius: 12, backgroundColor: "#334155", justifyContent: "center", padding: 16 }}>
				<Text style={{ color: "white", fontWeight: "700" }}>{tall ? "tall content (220)" : "short content (110)"}</Text>
			</View>
			<Row>
				<Button label="toggle height" testID="sheet-auto-toggle" onPress={() => setTall((v) => !v)} />
				<Button label="snap auto" testID="sheet-auto-snap-auto" onPress={() => snapTo(0)} />
				<Button label="snap full" testID="sheet-auto-snap-full" onPress={() => snapTo(1)} />
				<Button label="close" testID="sheet-auto-close" onPress={() => navigation.goBack()} />
			</Row>
		</SheetBody>
	);
}

function Component() {
	return (
		<LabContainer>
			<Stack.Navigator>
				<Stack.Screen name="Home" component={Home} />
				<Stack.Screen name="Snap" component={SnapSheet} options={sheet([0.4, 0.7, 1])} />
				<Stack.Screen name="Auto" component={AutoSheet} options={sheet(["auto", 1])} />
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "sheet",
	title: "sheet",
	covers: "snapTo, gesture expand/collapse/dismiss, gestureSnapLocked, sheetSnapBehavior, auto snap point",
	Component,
};
