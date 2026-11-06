// @ts-nocheck
/**
 * manybounds (measurement): what mounting many Transition.Boundary views costs.
 *   mount N    renders N boundary cards in a ScrollView at once; mb-result shows the JS time from the
 *              press to the commit (layout effect) and to the first frame after it
 *   plain      the same with plain Views (the baseline)
 *   animated   the same with Reanimated views, each with a trivial useAnimatedStyle: the floor for any
 *              element that animates on the UI thread (a boundary can't be cheaper than this)
 *   list       a FlatList of 1000 boundary cards to fling through (virtualized mounting while scrolling;
 *              read harness-state perf for dropped UI frames)
 *   cycles     mount and clear 300 boundaries 12 (or 40) times; mb-cycles-result lists commit/frame and the
 *              JS heap per cycle. Both stay flat; growth means unmounted boundaries are kept alive (a
 *              per-boundary JS function captured by a UI worklet did that: see first-escape-measure.ts)
 */
import { memo, useLayoutEffect, useRef, useState } from "react";
import { FlatList, ScrollView, Text, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { Button, colorFor, createBlankStackNavigator, LabContainer, Probe, Transition, type Lab } from "./ui";

const Stack = createBlankStackNavigator();
const COUNTS = [100, 300];
const ITEMS = Array.from({ length: 1000 }, (_, i) => `${i}`);

function AnimatedCard({ style, children }) {
	const opacity = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
	return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

function Card({ id, plain, size }) {
	const style = { width: size, height: size * 0.8, borderRadius: 16, backgroundColor: colorFor(`m${id}`), justifyContent: "flex-end", padding: 10 };
	const label = <Text style={{ color: "white", fontWeight: "800" }}>{id}</Text>;
	if (plain === "animated") return <AnimatedCard style={style}>{label}</AnimatedCard>;
	if (plain) return <View style={style}>{label}</View>;
	return (
		<Transition.Boundary id={id} group="many" style={style}>
			{label}
		</Transition.Boundary>
	);
}

// Memoized on the run: the result readout re-renders Home, and must not re-render (and re-time) the grid.
const Grid = memo(function Grid({ count, plain, started, onCommitted }) {
	const { width } = useWindowDimensions();
	const size = (width - 40 - 20) / 3;
	useLayoutEffect(() => {
		const committed = performance.now();
		requestAnimationFrame(() => onCommitted(committed - started, performance.now() - started));
	}, []);
	return (
		<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
			{Array.from({ length: count }, (_, i) => (
				<Card key={i} id={`${i}`} plain={plain} size={size} />
			))}
		</View>
	);
}, (a, b) => a.count === b.count && a.plain === b.plain && a.started === b.started);

function Home() {
	const [run, setRun] = useState(null);
	const [result, setResult] = useState("idle");
	const [list, setList] = useState(false);
	const { width } = useWindowDimensions();
	const size = (width - 40 - 20) / 3;
	const runs = useRef(0);

	const [cycles, setCycles] = useState("");

	// Mount and clear 300 of them n times. Each line is commit/first frame (ms) and the JS heap (MB) before
	// that mount: both must stay flat. A boundary that leaks its tree grows them every cycle.
	const runCycles = async (plain, n) => {
		setCycles("running");
		const heap = () => Math.round((globalThis.HermesInternal?.getInstrumentedStats?.().js_heapSize ?? 0) / 1e6);
		const out = [];
		for (let i = 0; i < n; i++) {
			setRun(null);
			await new Promise((r) => setTimeout(r, 500));
			const h = heap();
			const r = await new Promise((resolve) => {
				requestAnimationFrame(() => {
					runs.current += 1;
					setRun({ count: 300, plain, started: performance.now(), key: runs.current, done: (cm, fr) => resolve(`${Math.round(cm)}/${Math.round(fr)}`) });
				});
			});
			out.push(`${i + 1}:${r} h${h}`);
		}
		setRun(null);
		setCycles(`${plain === "animated" ? "animated" : plain ? "plain" : "bounds"} ${out.join(" ")} END`);
	};

	const start = (count, plain) => {
		setRun(null);
		setResult("…");
		requestAnimationFrame(() => {
			runs.current += 1;
			setRun({ count, plain, started: performance.now(), key: runs.current });
		});
	};

	return (
		<View style={{ flex: 1, backgroundColor: "#111827", paddingTop: 100 }}>
			<View style={{ paddingHorizontal: 20, gap: 8 }}>
				<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
					{COUNTS.map((n) => (
						<Button key={n} label={`mount ${n}`} testID={`mb-mount-${n}`} onPress={() => start(n, false)} />
					))}
					{COUNTS.map((n) => (
						<Button key={`p${n}`} label={`plain ${n}`} testID={`mb-plain-${n}`} onPress={() => start(n, true)} />
					))}
					<Button label={list ? "• list" : "list"} testID="mb-list" onPress={() => { setRun(null); setList(!list); }} />
					<Button label="clear" testID="mb-clear" onPress={() => { setRun(null); setResult("idle"); }} />
				</View>
				<Probe testID="mb-result" value={result} />
				<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
					<Button label="cycles ×12" testID="mb-cycles" onPress={() => runCycles(false, 12)} />
					<Button label="cycles ×40" testID="mb-cycles-40" onPress={() => runCycles(false, 40)} />
					<Button label="plain cycles ×12" testID="mb-cycles-plain" onPress={() => runCycles(true, 12)} />
					<Button label="animated cycles ×12" testID="mb-cycles-animated" onPress={() => runCycles("animated", 12)} />
				</View>
				<Probe testID="mb-cycles-result" value={cycles} />
			</View>
			{list ? (
				<FlatList
					data={ITEMS}
					numColumns={3}
					keyExtractor={(id) => id}
					contentContainerStyle={{ padding: 20, gap: 10 }}
					columnWrapperStyle={{ gap: 10 }}
					renderItem={({ item }) => <Card id={item} plain={false} size={size} />}
				/>
			) : (
				<ScrollView contentContainerStyle={{ padding: 20 }}>
					{run ? (
						<Grid
							key={run.key}
							count={run.count}
							plain={run.plain}
							started={run.started}
							onCommitted={(commit, frame) => run.done ? run.done(commit, frame) : setResult(`${run.plain ? "plain" : "bounds"} ${run.count}: commit ${commit.toFixed(0)}ms frame ${frame.toFixed(0)}ms`)}
						/>
					) : null}
				</ScrollView>
			)}
		</View>
	);
}

function Component() {
	return (
		<LabContainer>
			<Stack.Navigator>
				<Stack.Screen name="home" component={Home} />
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = { id: "manybounds", title: "manybounds", covers: "measurement: mounting many boundaries", Component };
