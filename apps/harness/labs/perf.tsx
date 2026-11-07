// @ts-nocheck
/**
 * perf lab: the same push/pop workload through three navigators, measured in the app (runs by itself,
 * so it works on a device with nothing driving it):
 *   blank   react-native-screen-transitions' blank stack, the harness slide (spring, 0.3 parallax)
 *   js      @react-navigation/stack, TransitionPresets.SlideFromRightIOS (same spring, same parallax)
 *   native  @react-navigation/native-stack, the platform push (reference)
 * and the library's shared bounds, through the blank stack from a grid of four Transition.Boundary cards:
 *   zoom    bounds().navigation.zoom()                      no destination boundary
 *   bound   navigation.zoom({ target: "bound" })            lands on a destination boundary
 *   morph   bounds().styles() on the card's tag             the card's rect morphs into the detail's
 *   mount   300 boundaries mounted and cleared 8 times     median ms to the commit and to the first frame,
 *           then the same with plain Views (the floor)
 * Each stack round pushes 10 screens and pops them; each bounds round pushes a card's detail and goes back
 * 10 times (20 transitions either way), 700 ms apart, under each synthetic UI-thread load (bridge
 * perf/load: ms burned every frame, so whatever costs more per frame drops sooner).
 * Per round: UI frames dropped / late (bridge frame monitor, against ?hz=, default 120), UI fps (frames rendered),
 * and the JS thread's requestAnimationFrame frames dropped. Options: harness://lab/perf?rounds=js,blank&loads=0,6&hz=60
 * ?suite=track runs what e2e/perf/track.py records per commit: blank, zoom, bound, morph and js twice each
 * (interleaved), at loads of 0, 50, 65 and 80 % of a refresh (?fractions=0,.85,.9,.95 to change them), then mount.
 * Results show on screen, go to Documents/perf.json and are logged as `HARNESS_PERF <i>/<n> <chunk>` lines
 * (logcat on Android, where the file can't be read from a Release build).
 */
import { NavigationContainer, NavigationIndependentTree, StackActions, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import { File, Paths } from "expo-file-system";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Linking, Platform, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { COLORS, colorFor, createBlankStackNavigator, interpolate, SPEC, slide, Transition, type Lab } from "./ui";

const KINDS = ["blank", "js", "native"] as const;
/** Bounds kinds: a grid of cards pushing one detail at a time (the push target is the kind). */
const BOUNDS_KINDS = ["zoom", "bound", "morph"];
const CARDS = ["a", "b", "c", "d"];
const GROUP = "perf";
const MOUNT_COUNT = 300;
const MOUNT_CYCLES = 8;
const TRACK_ROUNDS = ["blank", "zoom", "bound", "morph", "js", "blank", "zoom", "bound", "morph", "js", "mount"];
const TRACK_LOADS = [0, 0.5, 0.65, 0.8];
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

/** The card id of whichever route in the pair carries one. */
const routeId = ({ active, current, next }) => {
	"worklet";
	return active?.route?.params?.id ?? next?.route?.params?.id ?? current?.route?.params?.id ?? "";
};

const zoomOptions = (target?: "bound") => ({
	transitionSpec: Transition.Specs.Zoom,
	screenStyleInterpolator: (props) => {
		"worklet";
		const id = routeId(props);
		if (!id) return {};
		return props.bounds({ id, group: GROUP }).navigation.zoom(target ? { target } : undefined);
	},
});

const morphOptions = {
	transitionSpec: { open: SPEC, close: SPEC },
	screenStyleInterpolator: (props) => {
		"worklet";
		const { bounds, progress, focused } = props;
		const id = routeId(props);
		if (!id) return {};
		return {
			[`${GROUP}:${id}`]: bounds({ id, group: GROUP }).styles(),
			"perf-morph-body": { opacity: interpolate(progress, [0.5, 1], [0, 1], "clamp") },
			backdrop: focused ? { style: { backgroundColor: "black", opacity: interpolate(progress, [0, 1], [0, 0.85], "clamp") } } : undefined,
		};
	},
};

function CardGrid() {
	const { width } = useWindowDimensions();
	const size = (width - 40 - 10) / 2;
	return (
		<View style={{ flex: 1, backgroundColor: "#111827", paddingTop: 110, paddingHorizontal: 20 }}>
			<Text style={{ color: "white", fontSize: 34, fontWeight: "800", marginBottom: 12 }}>Cards</Text>
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
				{CARDS.map((id) => (
					<Transition.Boundary key={id} id={id} group={GROUP} style={{ width: size, height: size * 0.8, borderRadius: 20, backgroundColor: colorFor(id), justifyContent: "flex-end", padding: 14 }}>
						<Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>{id}</Text>
					</Transition.Boundary>
				))}
			</View>
		</View>
	);
}

function CardDetail({ route }) {
	const { id } = route.params;
	const destination = route.name !== "zoom";
	return (
		<View style={{ flex: 1, backgroundColor: route.name === "zoom" ? colorFor(id) : "#0b0b0f", paddingTop: 110, paddingHorizontal: 20, gap: 12 }}>
			{destination ? (
				<Transition.Boundary id={id} group={GROUP} style={{ height: 300, borderRadius: 28, backgroundColor: colorFor(id), justifyContent: "flex-end", padding: 18 }}>
					<Text style={{ color: "white", fontSize: 40, fontWeight: "800" }}>{id}</Text>
				</Transition.Boundary>
			) : null}
			<Transition.View styleId="perf-morph-body" style={{ gap: 6 }}>
				{Array.from({ length: 12 }, (_, row) => (
					<View key={row} style={{ height: 26, borderRadius: 8, backgroundColor: "#fff3" }} />
				))}
			</Transition.View>
		</View>
	);
}

function Navigator({ kind }) {
	if (BOUNDS_KINDS.includes(kind)) {
		return (
			<Blank.Navigator>
				<Blank.Screen name="grid" component={CardGrid} />
				<Blank.Screen name="zoom" component={CardDetail} options={zoomOptions()} />
				<Blank.Screen name="bound" component={CardDetail} options={zoomOptions("bound")} />
				<Blank.Screen name="morph" component={CardDetail} options={morphOptions} />
			</Blank.Navigator>
		);
	}
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
			if (BOUNDS_KINDS.includes(kind)) {
				for (let i = 0; i < PUSHES; i++) {
					ref.dispatch(StackActions.push(kind, { id: CARDS[i % CARDS.length] }));
					await sleep(GAP_MS);
					ref.goBack();
					await sleep(GAP_MS);
				}
			} else {
				for (let i = 1; i <= PUSHES; i++) {
					ref.dispatch(StackActions.push("S", { i }));
					await sleep(GAP_MS);
				}
				for (let i = 1; i <= PUSHES; i++) {
					ref.goBack();
					await sleep(GAP_MS);
				}
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

const median = (values: number[]) => {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.floor(sorted.length / 2)];
};

function MountGrid({ plain, started, onCommitted }) {
	const { width } = useWindowDimensions();
	const size = (width - 40 - 20) / 3;
	useLayoutEffect(() => {
		const committed = performance.now();
		requestAnimationFrame(() => onCommitted(committed - started, performance.now() - started));
	}, []);
	return (
		<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
			{Array.from({ length: MOUNT_COUNT }, (_, i) => {
				const style = { width: size, height: size * 0.8, borderRadius: 16, backgroundColor: colorFor(`m${i}`) };
				return plain ? <View key={i} style={style} /> : <Transition.Boundary key={i} id={`${i}`} group="perf-mount" style={style} />;
			})}
		</View>
	);
}

function MountScreen({ onDone, onError }) {
	const [run, setRun] = useState(null);
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				globalThis.__harness.setLevel(0);
				const results = [];
				for (const plain of [false, true]) {
					const commits = [];
					const frames = [];
					for (let i = 0; i < MOUNT_CYCLES; i++) {
						setRun(null);
						await sleep(500);
						const [commit, frame] = await new Promise((resolve) => {
							requestAnimationFrame(() => setRun({ plain, started: performance.now(), key: `${plain}${i}`, done: (c, f) => resolve([c, f]) }));
						});
						commits.push(Math.round(commit));
						frames.push(Math.round(frame));
					}
					results.push({ kind: plain ? "mount-plain" : "mount", count: MOUNT_COUNT, cycles: MOUNT_CYCLES, commit: median(commits), frame: median(frames), commits, frames });
				}
				setRun(null);
				globalThis.__harness.setLevel(1);
				if (!cancelled) onDone(results);
			} catch (e) {
				globalThis.__harness.setLevel(1);
				onError(`mount: ${e?.message ?? e}`);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);
	return (
		<ScrollView style={{ flex: 1, backgroundColor: "#111827" }} contentContainerStyle={{ padding: 20, paddingTop: 100 }}>
			{run ? <MountGrid key={run.key} plain={run.plain} started={run.started} onCommitted={run.done} /> : null}
		</ScrollView>
	);
}

/** The mount round: inside a blank stack screen, like a real list of boundaries. */
function MountBench({ onDone, onError }) {
	return (
		<NavigationIndependentTree>
			<NavigationContainer>
				<Blank.Navigator>
					<Blank.Screen name="mount">{() => <MountScreen onDone={onDone} onError={onError} />}</Blank.Screen>
				</Blank.Navigator>
			</NavigationContainer>
		</NavigationIndependentTree>
	);
}

/** Logs the results in chunks that fit a logcat line. */
const logResults = (json: string) => {
	const size = 3000;
	const count = Math.ceil(json.length / size);
	for (let i = 0; i < count; i++) console.log(`HARNESS_PERF ${i + 1}/${count} ${json.slice(i * size, (i + 1) * size)}`);
};

function useConfig() {
	const [config, setConfig] = useState(null);
	useEffect(() => {
		Linking.getInitialURL().then((initial) => {
			const latest = globalThis.__harnessLastUrl ?? initial ?? "";
			const url = latest.includes("lab/perf") ? latest : "";
			const param = (name) => url.match(new RegExp(`[?&]${name}=([\\w,.]+)`))?.[1]?.split(",");
			HZ = Number(param("hz")?.[0] ?? 120);
			const track = param("suite")?.[0] === "track";
			// Track loads are fractions of a refresh, so a 60 Hz simulator and a 120 Hz phone are loaded alike.
			// ?fractions= replaces them (Android's UI thread has more headroom: e2e/perf/track.py passes 0,.85,.9,.95).
			const fractions = (param("fractions") ?? TRACK_LOADS).map(Number);
			const trackLoads = fractions.map((f) => Math.round((f * 1000 * 10) / HZ) / 10);
			setConfig({
				suite: track ? "track" : "custom",
				rounds: param("rounds") ?? (track ? TRACK_ROUNDS : DEFAULT_ROUNDS),
				loads: (param("loads") ?? (track ? trackLoads : DEFAULT_LOADS)).map(Number),
			});
		});
	}, []);
	return config;
}

function PerfLab() {
	const config = useConfig();
	return config ? <PerfRun suite={config.suite} rounds={config.rounds} loads={config.loads} /> : null;
}

function PerfRun({ suite, rounds: ROUNDS, loads: LOADS }) {
	const [round, setRound] = useState(0);
	const [results, setResults] = useState([]);
	const [error, setError] = useState(null);
	const done = round >= ROUNDS.length || error !== null;
	useEffect(() => {
		if (!done) return;
		try {
			const json = JSON.stringify({ at: new Date().toISOString(), suite, platform: Platform.OS, hz: HZ, loads: LOADS, pushes: PUSHES, gapMs: GAP_MS, error, results });
			logResults(json);
			new File(Paths.document, "perf.json").write(json);
		} catch (e) {
			console.error(`perf: could not write results: ${e?.message ?? e}`);
		}
	}, [done, results, error]);
	if (!done) {
		return (
			<View style={{ flex: 1, backgroundColor: "black" }}>
				{(() => {
					const props = {
						key: round,
						onError: (message) => {
							console.error(`perf: ${message}`);
							setError(message);
						},
						onDone: (r) => {
							setResults((all) => [...all, ...r]);
							setRound((n) => n + 1);
						},
					};
					return ROUNDS[round] === "mount" ? <MountBench {...props} /> : <Bench {...props} kind={ROUNDS[round]} loads={LOADS} />;
				})()}
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
					{r.ui
						? `${r.kind.padEnd(6)} load ${r.load}: UI drop ${r.ui.dropped} late ${r.ui.late} ${r.ui.fps}fps | JS drop ${r.js.dropped} ${r.js.fps}fps`
						: `${r.kind.padEnd(11)} ${r.count}: commit ${r.commit}ms frame ${r.frame}ms (median of ${r.cycles})`}
				</Text>
			))}
		</ScrollView>
	);
}

export const lab: Lab = {
	id: "perf",
	title: "Perf: stacks and shared bounds",
	covers: "push/pop through three navigators and zoom/bound/morph/mount through the blank stack, measured in the app (frame drops under UI load, mount ms)",
	Component: PerfLab,
};
