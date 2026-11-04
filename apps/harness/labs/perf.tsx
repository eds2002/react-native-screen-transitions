// @ts-nocheck
/**
 * perf lab: the same push/pop workload through three navigators, measured in the app (runs by itself,
 * so it works on a device with nothing driving it):
 *   blank   react-native-screen-transitions' blank stack, the harness slide (spring, 0.3 parallax)
 *   js      @react-navigation/stack, TransitionPresets.SlideFromRightIOS (same spring, same parallax)
 *   native  @react-navigation/native-stack, the platform push (reference)
 * Each round pushes 10 screens and pops them, 700 ms apart, under each synthetic UI-thread load
 * (bridge perf/load: ms burned every frame, so a stack that costs more per frame drops sooner).
 * Per round: UI frames dropped / late (bridge frame monitor, against ?hz=, default 120), UI fps (frames rendered),
 * and the JS thread's requestAnimationFrame frames dropped. Options: harness://lab/perf?rounds=js,blank&loads=0,6&hz=60 Results show on screen and go to Documents/perf.json.
 */
import { NavigationContainer, NavigationIndependentTree, StackActions, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import { File, Paths } from "expo-file-system";
import { useEffect, useRef, useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";
import { COLORS, createBlankStackNavigator, slide, type Lab } from "./ui";

const KINDS = ["blank", "js", "native"] as const;
/** harness://lab/perf?rounds=blank,js&loads=0,6 overrides these. */
const DEFAULT_ROUNDS = [...KINDS, ...KINDS];
const DEFAULT_LOADS = [0, 3, 5, 6];
const PUSHES = 10;
const GAP_MS = 700;
/** Display refresh the monitors count against: 120 on ProMotion phones, 60 on the simulator (?hz=60). */
let HZ = 120;

const Blank = createBlankStackNavigator();
const Js = createStackNavigator();
const Native = createNativeStackNavigator();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The same screen in every navigator: a colored page with a title and 24 rows. */
function BenchScreen({ route }) {
	const index = route.params?.i ?? 0;
	return (
		<View style={{ flex: 1, backgroundColor: COLORS[index % COLORS.length], paddingTop: 110, paddingHorizontal: 20 }}>
			<Text style={{ color: "white", fontSize: 34, fontWeight: "800", marginBottom: 12 }}>Screen {index}</Text>
			{Array.from({ length: 24 }, (_, row) => (
				<View key={row} style={{ height: 26, marginBottom: 6, borderRadius: 8, backgroundColor: "#0003", justifyContent: "center", paddingHorizontal: 10 }}>
					<Text style={{ color: "white" }}>Row {row}</Text>
				</View>
			))}
		</View>
	);
}

function Navigator({ kind }) {
	if (kind === "blank") {
		return (
			<Blank.Navigator screenOptions={slide("horizontal")}>
				<Blank.Screen name="S" component={BenchScreen} />
			</Blank.Navigator>
		);
	}
	if (kind === "js") {
		return (
			<Js.Navigator screenOptions={{ headerShown: false, ...TransitionPresets.SlideFromRightIOS }}>
				<Js.Screen name="S" component={BenchScreen} />
			</Js.Navigator>
		);
	}
	return (
		<Native.Navigator screenOptions={{ headerShown: false }}>
			<Native.Screen name="S" component={BenchScreen} />
		</Native.Navigator>
	);
}

/** JS thread health: requestAnimationFrame frames later than one refresh. */
function startJsMonitor() {
	const stats = { frames: 0, dropped: 0, worst: 0 };
	let last = -1;
	let running = true;
	const tick = (t: number) => {
		if (!running) return;
		if (last >= 0) {
			const dt = t - last;
			const vsync = 1000 / HZ;
			if (dt >= vsync / 2) {
				const missed = Math.max(0, Math.round(dt / vsync) - 1);
				stats.frames += 1 + missed;
				stats.dropped += missed;
				stats.worst = Math.max(stats.worst, dt);
			}
		}
		last = t;
		requestAnimationFrame(tick);
	};
	requestAnimationFrame(tick);
	return () => {
		running = false;
		return { ...stats, worst: Math.round(stats.worst * 10) / 10 };
	};
}

function Bench({ kind, loads, onDone, onError }) {
	const ref = useNavigationContainerRef();
	const started = useRef(false);
	const run = async () => {
		if (started.current) return;
		started.current = true;
		const h = globalThis.__harness;
		try {
		h.setLevel(0);
		await sleep(1500);
		const results = [];
		for (const load of loads) {
			h.setLoad(load);
			await sleep(300);
			h.resetPerf(HZ);
			const stopJs = startJsMonitor();
			const t0 = Date.now();
			for (let i = 1; i <= PUSHES; i++) {
				ref.dispatch(StackActions.push("S", { i }));
				await sleep(GAP_MS);
			}
			for (let i = 1; i <= PUSHES; i++) {
				ref.goBack();
				await sleep(GAP_MS);
			}
			const seconds = (Date.now() - t0) / 1000;
			const js = stopJs();
			const ui = h.summary().perf;
			results.push({ kind, load, seconds, ui: { ...ui, fps: Math.round((ui.frames - ui.dropped) / seconds) }, js: { ...js, fps: Math.round((js.frames - js.dropped) / seconds) } });
		}
		h.setLoad(0);
		h.setLevel(1);
		onDone(results);
		} catch (e) {
			h.setLoad(0);
			h.setLevel(1);
			onError(`${kind}: ${e?.message ?? e}`);
		}
	};
	return (
		<NavigationIndependentTree>
			<NavigationContainer ref={ref} onReady={run}>
				<Navigator kind={kind} />
			</NavigationContainer>
		</NavigationIndependentTree>
	);
}

function useConfig() {
	const [config, setConfig] = useState(null);
	useEffect(() => {
		Linking.getInitialURL().then((initial) => {
			const latest = globalThis.__harnessLastUrl ?? initial ?? "";
			const url = latest.includes("lab/perf") ? latest : "";
			const param = (name) => url.match(new RegExp(`[?&]${name}=([\\w,]+)`))?.[1]?.split(",");
			HZ = Number(param("hz")?.[0] ?? 120);
			setConfig({ rounds: param("rounds") ?? DEFAULT_ROUNDS, loads: (param("loads") ?? DEFAULT_LOADS).map(Number) });
		});
	}, []);
	return config;
}

function PerfLab() {
	const config = useConfig();
	return config ? <PerfRun rounds={config.rounds} loads={config.loads} /> : null;
}

function PerfRun({ rounds: ROUNDS, loads: LOADS }) {
	const [round, setRound] = useState(0);
	const [results, setResults] = useState([]);
	const [error, setError] = useState(null);
	const done = round >= ROUNDS.length || error !== null;
	useEffect(() => {
		if (!done) return;
		try {
			new File(Paths.document, "perf.json").write(JSON.stringify({ at: new Date().toISOString(), hz: HZ, loads: LOADS, pushes: PUSHES, gapMs: GAP_MS, error, results }, null, 1));
		} catch (e) {
			console.error(`perf: could not write results: ${e?.message ?? e}`);
		}
	}, [done, results, error]);
	if (!done) {
		return (
			<View style={{ flex: 1, backgroundColor: "black" }}>
				<Bench
					key={round}
					kind={ROUNDS[round]}
					loads={LOADS}
					onError={(message) => {
						console.error(`perf: ${message}`);
						setError(message);
					}}
					onDone={(r) => {
						setResults((all) => [...all, ...r]);
						setRound((n) => n + 1);
					}}
				/>
				<Text testID="perf-status" style={{ position: "absolute", bottom: 40, left: 20, color: "white", backgroundColor: "#000a", padding: 6 }}>
					round {round + 1}/{ROUNDS.length}: {ROUNDS[round]}
				</Text>
			</View>
		);
	}
	return (
		<ScrollView style={{ flex: 1, backgroundColor: "black" }} contentContainerStyle={{ padding: 20, paddingTop: 100 }}>
			<Text testID="perf-done" style={{ color: "white", fontSize: 22, fontWeight: "800", marginBottom: 10 }}>perf: done (Documents/perf.json)</Text>
			{error ? <Text testID="perf-error" style={{ color: "#f87171", marginBottom: 10 }}>error: {error}</Text> : null}
			{results.map((r, i) => (
				<Text key={i} style={{ color: "white", fontFamily: "Menlo", fontSize: 11 }}>
					{`${r.kind.padEnd(6)} load ${r.load}: UI drop ${r.ui.dropped} late ${r.ui.late} ${r.ui.fps}fps | JS drop ${r.js.dropped} ${r.js.fps}fps`}
				</Text>
			))}
		</ScrollView>
	);
}

export const lab: Lab = {
	id: "perf",
	title: "Perf: blank vs JS vs native stack",
	covers: "the same push/pop workload through three navigators, measured in the app (frame drops under UI load)",
	Component: PerfLab,
};
