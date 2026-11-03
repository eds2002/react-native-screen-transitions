// @ts-nocheck
/**
 * The device harness: one lab per library mechanism (labs/), each a small
 * screen family with labelled buttons and testIDs for Argent loops.
 * Deep link: harness://lab/<id>
 */
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { LABS } from "./labs";
import { BridgeProbe, bridge } from "./labs/bridge";

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
	const url = Linking.useURL();
	useEffect(() => {
		const match = url?.match(/lab\/([\w-]+)/);
		if (match) setOpen(match[1]);
	}, [url]);
	const lab = LABS.find((l) => l.id === open);
	useEffect(() => bridge.setLab(lab?.id ?? null), [lab?.id]);
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
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
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
