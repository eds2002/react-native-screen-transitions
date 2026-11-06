// @ts-nocheck
/**
 * screencycles (measurement): are popped screens freed? Pushes a screen and pops it n times. Each pushed
 * screen holds a ~2 MB ballast array, and the lab keeps a WeakRef to every ballast. After each pop,
 * sc-result records how many ballasts are still alive and the JS heap. Freed screens: the live count
 * stays small (whatever GC has not reached yet) and the heap stays bounded. Retained screens: both climb
 * by one ballast per cycle.
 *
 *   slide ×20   default slide, gesture enabled (pan lifecycle, open/close completion)
 *   sheet ×20   a sheet with backdrop dismiss (sheet snap, backdrop)
 *   toggle ×20  control: the same ballast mounted/unmounted with no navigation
 *   pressure    allocate ~600 MB of garbage so full GCs run, then recount the live ballasts
 */
import { useState } from "react";
import { Text, View } from "react-native";
import {
	Button,
	createBlankStackNavigator,
	LabContainer,
	Probe,
	sheet,
	slide,
	type Lab,
} from "./ui";

const Stack = createBlankStackNavigator();
const refs = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const heap = () =>
	Math.round(
		(globalThis.HermesInternal?.getInstrumentedStats?.().js_heapSize ?? 0) /
			1e6,
	);
const alive = () =>
	typeof WeakRef === "undefined"
		? "n/a"
		: refs.filter((r) => r.deref() !== undefined).length;

function Ballast() {
	useState(() => {
		const ballast = Array.from({ length: 250_000 }, (_, i) => i * 1.5);
		if (typeof WeakRef !== "undefined") refs.push(new WeakRef(ballast));
		return ballast;
	});
	return null;
}

function Home({ navigation }) {
	const [result, setResult] = useState("idle");
	const [showBallast, setShowBallast] = useState(false);
	// Control: the same ballast mounted and unmounted without navigation (no screen, no transition).
	const runToggle = async (n) => {
		setResult("running");
		refs.length = 0;
		const out = [];
		for (let i = 0; i < n; i++) {
			setShowBallast(true);
			await wait(900);
			setShowBallast(false);
			await wait(900);
			out.push(`${i + 1}:a${alive()} h${heap()}`);
		}
		setResult(`toggle ${out.join(" ")} END`);
	};
	// Allocate ~600 MB of short-lived garbage in steps so full collections run, then recount: a ballast
	// still alive after this is referenced, not just waiting for GC.
	const pressure = async () => {
		const before = alive();
		setResult("pressure");
		for (let i = 0; i < 60; i++) {
			Array.from({ length: 1_250_000 }, (_, j) => j * 0.5);
			await wait(30);
		}
		await wait(500);
		setResult(
			`pressure alive ${before} -> ${alive()} of ${refs.length}, h${heap()} END`,
		);
	};
	const run = async (route, n) => {
		setResult("running");
		refs.length = 0;
		const out = [];
		for (let i = 0; i < n; i++) {
			navigation.push(route);
			await wait(900);
			navigation.goBack();
			await wait(900);
			out.push(`${i + 1}:a${alive()} h${heap()}`);
		}
		setResult(`${route} ${out.join(" ")} END`);
	};
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: "#111827",
				paddingTop: 100,
				paddingHorizontal: 20,
				gap: 8,
			}}
		>
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
				<Button
					label="slide ×20"
					testID="sc-slide"
					onPress={() => run("slide", 20)}
				/>
				<Button
					label="sheet ×20"
					testID="sc-sheet"
					onPress={() => run("sheet", 20)}
				/>
				<Button
					label="toggle ×20"
					testID="sc-toggle"
					onPress={() => runToggle(20)}
				/>
				<Button label="pressure" testID="sc-pressure" onPress={pressure} />
			</View>
			<Probe testID="sc-result" value={result} />
			{showBallast ? <Ballast /> : null}
		</View>
	);
}

function Detail({ route }) {
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: "#2563eb",
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<Ballast />
			<Text style={{ color: "white", fontSize: 32, fontWeight: "800" }}>
				{route.name}
			</Text>
		</View>
	);
}

function Component() {
	return (
		<LabContainer>
			<Stack.Navigator>
				<Stack.Screen name="home" component={Home} />
				<Stack.Screen name="slide" component={Detail} options={slide()} />
				<Stack.Screen
					name="sheet"
					component={Detail}
					options={sheet([0.6], { backdropBehavior: "dismiss" })}
				/>
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "screencycles",
	title: "screencycles",
	covers: "measurement: are popped screens freed (push/pop n times)",
	Component,
};
