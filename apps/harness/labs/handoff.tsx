// @ts-nocheck
/**
 * handoff: a true shared element. The card's content is live (a counter that keeps ticking and a bar
 * that keeps spinning): with `handoff`, the same view moves into the detail's slot instead of a copy
 * on each screen, so the counter never restarts.
 *   ho-mode-zoom   zoom to the slot (bounds("card").navigation.zoom({ target: "bound" }))
 *   ho-mode-morph  the slot morphs from the card while the detail fades in (bounds("card").styles())
 *   ho-mode-still  handoff as designed: the screens don't animate, only the boundaries do
 *                  (bounds("card").styles({ method: "size" }))
 *   ho-card        opens the detail; ho-back closes it
 *
 * What to look at: the live content should stay fully visible the whole way, in both directions.
 */
import { useEffect, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, {
	Easing,
	makeMutable,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import {
	Button,
	createBlankStackNavigator,
	type Lab,
	LabContainer,
	Probe,
	Transition,
} from "./ui";

const Stack = createBlankStackNavigator();
const mode = makeMutable("zoom");
// "fixed": the live content has a hardcoded size (the card's) instead of filling its boundary.
let fixedSize: { width: number; height: number } | null = null;

function LiveContent() {
	const [count, setCount] = useState(0);
	useEffect(() => {
		const id = setInterval(() => setCount((c) => c + 1), 100);
		return () => clearInterval(id);
	}, []);
	const turn = useSharedValue(0);
	useEffect(() => {
		turn.set(
			withRepeat(
				withTiming(360, { duration: 1500, easing: Easing.linear }),
				-1,
			),
		);
	}, [turn]);
	const spin = useAnimatedStyle(() => ({
		transform: [{ rotate: `${turn.get()}deg` }],
	}));
	return (
		<View
			style={{
				...(fixedSize ?? { flex: 1 }),
				backgroundColor: "#f59e0b",
				borderRadius: 20,
				alignItems: "center",
				justifyContent: "center",
				overflow: "hidden",
			}}
		>
			<Animated.View
				style={[
					{
						position: "absolute",
						width: 220,
						height: 14,
						borderRadius: 7,
						backgroundColor: "#0006",
					},
					spin,
				]}
			/>
			<Text style={{ color: "#111", fontSize: 34, fontWeight: "900" }}>
				{count}
			</Text>
			<Text style={{ color: "#111", fontWeight: "700" }}>live</Text>
		</View>
	);
}

function List({ navigation }) {
	const { width } = useWindowDimensions();
	const [current, setCurrent] = useState(mode.get());
	const [fixed, setFixed] = useState(fixedSize !== null);
	const size = width * 0.42;
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: "#111827",
				paddingTop: 110,
				paddingHorizontal: 20,
				gap: 14,
			}}
		>
			<Text style={{ color: "white", fontSize: 30, fontWeight: "800" }}>
				handoff
			</Text>
			<View style={{ flexDirection: "row", gap: 8 }}>
				{["zoom", "morph", "still"].map((m) => (
					<Button
						key={m}
						label={m === current ? `• ${m}` : m}
						testID={`ho-mode-${m}`}
						onPress={() => {
							mode.set(m);
							setCurrent(m);
						}}
					/>
				))}
			</View>
			<Button
				label={fixed ? "• fixed size" : "fixed size"}
				testID="ho-fixed"
				onPress={() => {
					fixedSize = fixed ? null : { width: size, height: size * 1.2 };
					setFixed(!fixed);
				}}
			/>
			<Probe
				testID="ho-mode"
				value={`mode:${current}${fixed ? " fixed" : ""}`}
			/>
			<Transition.Boundary
				key={fixed ? "fixed" : "flex"}
				id="card"
				handoff
				testID="ho-card"
				accessibilityLabel="ho-card"
				onPress={() => navigation.push("Detail")}
				style={{ width: size, height: size * 1.2, marginTop: 120 }}
			>
				<LiveContent />
			</Transition.Boundary>
		</View>
	);
}

function Detail({ navigation }) {
	const { width } = useWindowDimensions();
	return (
		<View
			style={{ flex: 1, backgroundColor: "#1e293b", paddingTop: 100, gap: 16 }}
		>
			<Transition.Boundary
				id="card"
				handoff
				style={{ width, height: width * 0.85 }}
			/>
			<View style={{ paddingHorizontal: 20, gap: 12 }}>
				<Text style={{ color: "white", fontSize: 26, fontWeight: "800" }}>
					Detail
				</Text>
				<Text style={{ color: "#cbd5e1" }}>
					The live card above is the same view as on the list.
				</Text>
				<Pressable
					testID="ho-back"
					accessibilityLabel="ho-back"
					onPress={() => navigation.goBack()}
					style={{
						alignSelf: "flex-start",
						backgroundColor: "#000c",
						paddingHorizontal: 16,
						paddingVertical: 10,
						borderRadius: 14,
					}}
				>
					<Text style={{ color: "white", fontWeight: "800" }}>Back</Text>
				</Pressable>
			</View>
		</View>
	);
}

const detail = {
	gestureEnabled: true,
	gestureDirection: ["vertical", "pinch-in"],
	transitionSpec: Transition.Specs.Zoom
		? { open: Transition.Specs.Zoom, close: Transition.Specs.Zoom }
		: undefined,
	screenStyleInterpolator: (props) => {
		"worklet";
		if (mode.get() === "zoom")
			return props.bounds("card").navigation.zoom({ target: "bound" });
		if (mode.get() === "still")
			return {
				card: { style: props.bounds("card").styles({ method: "size" }) },
			};
		if (props.next) return { card: { style: { opacity: 0 } } };
		return {
			content: { style: { opacity: Math.min(props.progress, 1) } },
			card: { style: props.bounds("card").styles() },
		};
	},
};

function Component() {
	return (
		<LabContainer>
			<Stack.Navigator>
				<Stack.Screen name="List" component={List} />
				<Stack.Screen name="Detail" component={Detail} options={detail} />
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "handoff",
	title: "handoff",
	covers:
		"A true shared element: a live card handed off into the detail (zoom and morph)",
	Component,
};
