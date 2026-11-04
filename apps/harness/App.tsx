// @ts-nocheck
/**
 * The device harness: one lab per library mechanism (labs/), each a small
 * screen family with labelled buttons and testIDs for Argent loops.
 * Deep links: harness://lab/<id>, harness://stamp/off (frame stamp off for perf runs), harness://stamp/on,
 * harness://bridge/<0|1|2> (bridge reporting level; 0 for perf runs), harness://perf/reset, harness://perf/hz/<n> (frame monitor)
 */
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { LABS } from "./labs";
import { BridgeProbe, bridge } from "./labs/bridge";
import { BLANK, FrameStamp } from "./labs/stamp";

function Home({ onOpen }) {
	const insets = useSafeAreaInsets();
	return (
		<ScrollView
			testID="labs-list"
			style={{ flex: 1, backgroundColor: "#0b0b0f" }}
			contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 16, gap: 8 }}
		>
			<Text style={{ color: "white", fontSize: 30, fontWeight: "800", marginBottom: 8 }}>Harness</Text>
			{LABS.map((lab) => (
				<Pressable key={lab.id} testID={`open-${lab.id}`} onPress={() => onOpen(lab.id)} style={{ backgroundColor: "#1c1c24", borderRadius: 12, padding: 12 }}>
					<Text style={{ color: "white", fontSize: 17, fontWeight: "700" }}>{lab.title}</Text>
					<Text style={{ color: "#999", fontSize: 12 }}>{lab.covers}</Text>
				</Pressable>
			))}
		</ScrollView>
	);
}

export default function App() {
	const [open, setOpen] = useState<string | null>(null);
	const [stamp, setStamp] = useState(true);
	const url = Linking.useURL();
	useEffect(() => {
		const lab = url?.match(/lab\/([\w-]+)/);
		if (lab) setOpen(lab[1]);
		const stampMatch = url?.match(/stamp\/(on|off)/);
		if (stampMatch) setStamp(stampMatch[1] === "on");
		const levelMatch = url?.match(/bridge\/(\d)/);
		if (levelMatch) globalThis.__harness.setLevel(Number(levelMatch[1]));
		const hzMatch = url?.match(/perf\/hz\/(\d+)/);
		if (hzMatch) globalThis.__harness.resetPerf(Number(hzMatch[1]));
		else if (url?.includes("perf/reset")) globalThis.__harness.resetPerf();
	}, [url]);
	const lab = LABS.find((l) => l.id === open);
	useEffect(() => bridge.setLab(lab?.id ?? null), [lab?.id]);
	return (
		<GestureHandlerRootView style={{ flex: 1, backgroundColor: BLANK }}>
			<SafeAreaProvider>
				<StatusBar style="light" />
				{lab ? (
					<View style={{ flex: 1 }}>
						<lab.Component />
						<Pressable testID="exit-lab" onPress={() => setOpen(null)} style={{ position: "absolute", top: 54, right: 16, zIndex: 1000, backgroundColor: "#000a", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 }}>
							<Text style={{ color: "white", fontWeight: "700" }}>✕ labs</Text>
						</Pressable>
					</View>
				) : (
					<Home onOpen={setOpen} />
				)}
				<BridgeProbe />
				{stamp ? <FrameStamp /> : null}
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
