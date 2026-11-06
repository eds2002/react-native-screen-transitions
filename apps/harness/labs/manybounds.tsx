// @ts-nocheck
/**
 * manybounds (measurement): what mounting many Transition.Boundary views costs.
 *   mount N    renders N boundary cards in a ScrollView at once; mb-result shows the JS time from the
 *              press to the commit (layout effect) and to the first frame after it
 *   plain      the same with plain Views (the baseline)
 *   list       a FlatList of 1000 boundary cards to fling through (virtualized mounting while scrolling;
 *              read harness-state perf for dropped UI frames)
 */
import { memo, useLayoutEffect, useRef, useState } from "react";
import { FlatList, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Button, colorFor, createBlankStackNavigator, LabContainer, Probe, Transition, type Lab } from "./ui";

const Stack = createBlankStackNavigator();
const COUNTS = [100, 300];
const ITEMS = Array.from({ length: 1000 }, (_, i) => `${i}`);

function Card({ id, plain, size }) {
	const style = { width: size, height: size * 0.8, borderRadius: 16, backgroundColor: colorFor(`m${id}`), justifyContent: "flex-end", padding: 10 };
	const label = <Text style={{ color: "white", fontWeight: "800" }}>{id}</Text>;
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
							onCommitted={(commit, frame) => setResult(`${run.plain ? "plain" : "bounds"} ${run.count}: commit ${commit.toFixed(0)}ms frame ${frame.toFixed(0)}ms`)}
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
