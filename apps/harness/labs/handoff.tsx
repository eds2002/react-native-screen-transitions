// @ts-nocheck
/**
 * handoff: a true shared element. The card's content is live (a counter that keeps ticking and a bar
 * that keeps spinning): with `handoff`, the same view moves into the detail's slot instead of a copy
 * on each screen, so the counter never restarts.
 * As designed, the screens don't animate, only the boundaries do (the live content is in the
 * receiving screen and takes whatever that screen does):
 *   ho-mode-size       bounds("card").styles({ method: "size" }): the content re-lays out as it grows
 *   ho-mode-transform  bounds("card").styles(): translate and scale
 *   ho-card        opens the detail; ho-next pushes the theater (another slot, another size: the live
 *                  content hands off again); ho-back / ho-back-2 close them
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
const mode = makeMutable("size");
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
				{["size", "transform"].map((m) => (
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
					testID="ho-next"
					accessibilityLabel="ho-next"
					onPress={() => navigation.push("Theater")}
					style={{
						alignSelf: "flex-start",
						backgroundColor: "#2563eb",
						paddingHorizontal: 16,
						paddingVertical: 10,
						borderRadius: 14,
					}}
				>
					<Text style={{ color: "white", fontWeight: "800" }}>Next</Text>
				</Pressable>
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

// A third screen: the same live content in a smaller, wider slot lower down.
function Theater({ navigation }) {
	const { width } = useWindowDimensions();
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: "#0b0b0f",
				paddingTop: 140,
				alignItems: "center",
				gap: 20,
			}}
		>
			<Text style={{ color: "white", fontSize: 26, fontWeight: "800" }}>
				Theater
			</Text>
			<Transition.Boundary
				id="card"
				handoff
				style={{ width: width * 0.8, height: width * 0.45, marginTop: 60 }}
			/>
			<Pressable
				testID="ho-back-2"
				accessibilityLabel="ho-back-2"
				onPress={() => navigation.goBack()}
				style={{
					backgroundColor: "#000c",
					paddingHorizontal: 16,
					paddingVertical: 10,
					borderRadius: 14,
				}}
			>
				<Text style={{ color: "white", fontWeight: "800" }}>Back</Text>
			</Pressable>
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
		return {
			card: {
				style: props
					.bounds("card")
					.styles(mode.get() === "size" ? { method: "size" } : undefined),
			},
		};
	},
};

function Component() {
	return (
		<LabContainer>
			<Stack.Navigator>
				<Stack.Screen name="List" component={List} />
				<Stack.Screen name="Detail" component={Detail} options={detail} />
				<Stack.Screen name="Theater" component={Theater} options={detail} />
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "handoff",
	title: "handoff",
	covers:
		"A true shared element: a live card handed off into the detail, only the boundaries animating (size and transform)",
	Component,
};
