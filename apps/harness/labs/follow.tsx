// @ts-nocheck
/**
 * follow: a shared bound on screens that move. The detail slides in from the right while the list
 * parallaxes left (the stack's usual slide), and a horizontal swipe drags the detail back. The card
 * is styled with `bounds("card").styles()` and nothing else: no offset. Both copies of the card
 * draw (the list's and the detail's), so any disagreement shows as two cards.
 *   fo-mode-slide   content translateX (slide + parallax)
 *   fo-mode-scale   the detail also scales while it moves (a card-like screen)
 *   fo-mode-still   the screens don't move (the reference: only the bound animates)
 *   fo-mode-slide-left / fade / zoom-in / card-stack / diagonal / slide-fade: more screen motions
 *   fo-mode-mixed   each screen arrives its own way (Detail slides and fades, Theater rises as a
 *                   card over a shrinking Detail, Gallery zooms in, Profile flies in diagonally)
 *   fo-method       toggles transform / size
 *   fo-handoff      the card is one live view handed between the slots (handoff) instead of a copy per screen
 *   fo-card         opens the detail; fo-next pushes the theater (the card hands on to a third slot);
 *                   fo-back / fo-back-2 close them; swipe right from the left edge drags the top one
 *   bar (fixed, for spam): fo-bar-next pushes the next screen (List -> Detail -> Theater -> Gallery
 *                   -> Profile: the card is bigger on Gallery, smaller on Profile),
 *                   fo-bar-back pops; their positions never move
 *
 * What to look at: one card the whole way. It leaves the list's slot and lands on the detail's slot
 * as the detail arrives, follows the detail while it is dragged, and lands back on the list's slot;
 * the same along the chain, and under any spam of next/back/drags.
 */
import { StackActions } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { makeMutable } from "react-native-reanimated";
import { Button, createBlankStackNavigator, interpolate, type Lab, LabContainer, Probe, SPEC, SpamBar, Transition } from "./ui";

const Stack = createBlankStackNavigator();
const mode = makeMutable("slide");
const method = makeMutable("transform");
const MODES = ["slide", "scale", "still", "slide-left", "fade", "zoom-in", "card-stack", "diagonal", "slide-fade", "mixed"];
const MIXED = { Detail: "slide-fade", Theater: "card-stack", Gallery: "zoom-in", Profile: "diagonal" };
const CHAIN = ["List", "Detail", "Theater", "Gallery", "Profile"];
// Handoff: the list's card (a live counter) is the only content; the other slots receive it.
let handoffOn = false;

function LiveCard() {
	const [count, setCount] = useState(0);
	useEffect(() => {
		const id = setInterval(() => setCount((c) => c + 1), 100);
		return () => clearInterval(id);
	}, []);
	return (
		<View style={{ flex: 1, backgroundColor: "#f59e0b", borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
			<Text style={{ color: "#111", fontSize: 28, fontWeight: "900" }}>{count}</Text>
			<Text style={{ color: "#111", fontWeight: "700" }}>live</Text>
		</View>
	);
}

// The list's copy is orange, the detail's blue: both draw, so any disagreement shows as two cards.
function Card({ color = "#f59e0b" }) {
	return (
		<View style={{ flex: 1, backgroundColor: color, borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
			<Text style={{ color: "#111", fontSize: 28, fontWeight: "900" }}>card</Text>
		</View>
	);
}

function List({ navigation }) {
	const { width } = useWindowDimensions();
	const [current, setCurrent] = useState(mode.get());
	const [m, setM] = useState(method.get());
	const [handoff, setHandoff] = useState(handoffOn);
	return (
		<View style={{ flex: 1, backgroundColor: "#111827", paddingTop: 110, paddingHorizontal: 20, gap: 12 }}>
			<Text style={{ color: "white", fontSize: 30, fontWeight: "800" }}>follow</Text>
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
				{MODES.map((value) => (
					<Button
						key={value}
						label={value === current ? `• ${value}` : value}
						testID={`fo-mode-${value}`}
						onPress={() => {
							mode.set(value);
							setCurrent(value);
						}}
					/>
				))}
			</View>
			<Button
				label={`method: ${m}`}
				testID="fo-method"
				onPress={() => {
					const next = m === "transform" ? "size" : "transform";
					method.set(next);
					setM(next);
				}}
			/>
			<Button
				label={handoff ? "• handoff" : "handoff"}
				testID="fo-handoff"
				onPress={() => {
					handoffOn = !handoff;
					setHandoff(!handoff);
				}}
			/>
			<Probe testID="fo-state" value={`mode:${current} method:${m}${handoff ? " handoff" : ""}`} />
			<Transition.Boundary
				key={handoff ? "handoff" : "copies"}
				id="card"
				handoff={handoff}
				testID="fo-card"
				accessibilityLabel="fo-card"
				onPress={() => navigation.push("Detail")}
				style={{ width: width * 0.4, height: width * 0.5, marginTop: 40 }}
			>
				{handoff ? <LiveCard /> : <Card />}
			</Transition.Boundary>
		</View>
	);
}

function Detail({ navigation }) {
	const { width } = useWindowDimensions();
	return (
		<View style={{ flex: 1, backgroundColor: "#1e293b", paddingTop: 100, paddingHorizontal: 20, gap: 16 }}>
			<Transition.Boundary id="card" handoff={handoffOn} style={{ width: width * 0.4, height: width * 0.5, alignSelf: "flex-end" }}>
				{handoffOn ? null : <Card color="#38bdf8" />}
			</Transition.Boundary>
			<Text style={{ color: "white", fontSize: 26, fontWeight: "800" }}>Detail</Text>
			<Pressable
				testID="fo-next"
				accessibilityLabel="fo-next"
				onPress={() => navigation.push("Theater")}
				style={{ alignSelf: "flex-start", backgroundColor: "#2563eb", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 }}
			>
				<Text style={{ color: "white", fontWeight: "800" }}>Next</Text>
			</Pressable>
			<Pressable
				testID="fo-back"
				accessibilityLabel="fo-back"
				onPress={() => navigation.goBack()}
				style={{ alignSelf: "flex-start", backgroundColor: "#000c", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 }}
			>
				<Text style={{ color: "white", fontWeight: "800" }}>Back</Text>
			</Pressable>
		</View>
	);
}

// A third screen: the card in another slot (lower, centered), handed on from the detail.
function Theater({ navigation }) {
	const { width } = useWindowDimensions();
	return (
		<View style={{ flex: 1, backgroundColor: "#0b0b0f", paddingTop: 140, alignItems: "center", gap: 20 }}>
			<Text style={{ color: "white", fontSize: 26, fontWeight: "800" }}>Theater</Text>
			<Transition.Boundary id="card" handoff={handoffOn} style={{ width: width * 0.4, height: width * 0.5, marginTop: 120 }}>
				{handoffOn ? null : <Card color="#22c55e" />}
			</Transition.Boundary>
			<Pressable
				testID="fo-next-2"
				accessibilityLabel="fo-next-2"
				onPress={() => navigation.push("Gallery")}
				style={{ backgroundColor: "#2563eb", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 }}
			>
				<Text style={{ color: "white", fontWeight: "800" }}>Next</Text>
			</Pressable>
			<Pressable
				testID="fo-back-2"
				accessibilityLabel="fo-back-2"
				onPress={() => navigation.goBack()}
				style={{ backgroundColor: "#000c", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 }}
			>
				<Text style={{ color: "white", fontWeight: "800" }}>Back</Text>
			</Pressable>
		</View>
	);
}

// Gallery: the card big, top left. Profile: the card small, low right.
function Gallery({ navigation }) {
	const { width } = useWindowDimensions();
	return (
		<View style={{ flex: 1, backgroundColor: "#3b0764", paddingTop: 110, paddingHorizontal: 20, gap: 16 }}>
			<Transition.Boundary id="card" handoff={handoffOn} style={{ width: width * 0.6, height: width * 0.75 }}>
				{handoffOn ? null : <Card color="#e879f9" />}
			</Transition.Boundary>
			<Text style={{ color: "white", fontSize: 26, fontWeight: "800" }}>Gallery</Text>
			<Pressable testID="fo-next-3" accessibilityLabel="fo-next-3" onPress={() => navigation.push("Profile")} style={{ alignSelf: "flex-start", backgroundColor: "#2563eb", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 }}>
				<Text style={{ color: "white", fontWeight: "800" }}>Next</Text>
			</Pressable>
		</View>
	);
}

function Profile() {
	const { width } = useWindowDimensions();
	return (
		<View style={{ flex: 1, backgroundColor: "#052e16", paddingTop: 140, paddingHorizontal: 20, gap: 16 }}>
			<Text style={{ color: "white", fontSize: 26, fontWeight: "800" }}>Profile</Text>
			<Transition.Boundary id="card" handoff={handoffOn} style={{ width: width * 0.28, height: width * 0.35, alignSelf: "flex-end", marginTop: 260 }}>
				{handoffOn ? null : <Card color="#facc15" />}
			</Transition.Boundary>
		</View>
	);
}

/** The content motion for `m` at progress (0 entering, 1 open, 2 covered); null for still. */
const motionStyle = (m, progress, screen) => {
	"worklet";
	const W = screen.width;
	const H = screen.height;
	if (m === "slide") return { transform: [{ translateX: interpolate(progress, [0, 1, 2], [W, 0, -W * 0.3]) }] };
	if (m === "scale")
		return { transform: [{ translateX: interpolate(progress, [0, 1, 2], [W, 0, -W * 0.3]) }, { scale: interpolate(progress, [0, 1, 2], [0.8, 1, 0.9]) }] };
	if (m === "slide-left") return { transform: [{ translateX: interpolate(progress, [0, 1, 2], [-W, 0, W * 0.3]) }] };
	if (m === "fade") return { opacity: interpolate(progress, [0, 1, 2], [0, 1, 1]) };
	if (m === "zoom-in")
		return { opacity: interpolate(progress, [0, 0.6, 1, 2], [0, 1, 1, 1]), transform: [{ scale: interpolate(progress, [0, 1, 2], [0.85, 1, 1.1]) }] };
	if (m === "card-stack")
		return { transform: [{ translateY: interpolate(progress, [0, 1, 2], [H, 0, -H * 0.02]) }, { scale: interpolate(progress, [0, 1, 2], [1, 1, 0.92]) }] };
	if (m === "diagonal")
		return {
			transform: [
				{ translateX: interpolate(progress, [0, 1, 2], [W, 0, -W * 0.2]) },
				{ translateY: interpolate(progress, [0, 1, 2], [H * 0.3, 0, -H * 0.1]) },
				{ scale: interpolate(progress, [0, 1, 2], [0.6, 1, 0.85]) },
			],
		};
	if (m === "slide-fade")
		return { opacity: interpolate(progress, [0, 1, 2], [0, 1, 0.4]), transform: [{ translateX: interpolate(progress, [0, 1, 2], [W * 0.5, 0, -W * 0.15]) }] };
	return null;
};

const dismissOf = (m) => (m === "slide-left" ? "horizontal-inverted" : m === "fade" || m === "zoom-in" || m === "card-stack" ? "vertical" : "horizontal");

// Options are read per screen: the mode and gesture direction are picked when the screen is pushed.
const detailFor = (name) => {
	const pick = () => (mode.get() === "mixed" ? MIXED[name] : mode.get());
	return {
		gestureEnabled: true,
		gestureDirection: dismissOf(pick()),
		transitionSpec: { open: SPEC, close: SPEC },
		screenStyleInterpolator: ({ progress, bounds, layouts: { screen } }) => {
			"worklet";
			const m = mode.get() === "mixed" ? MIXED[name] : mode.get();
			const card = { style: bounds("card").styles(method.get() === "size" ? { method: "size" } : undefined) };
			const content = motionStyle(m, progress, screen);
			return content ? { content: { style: content }, card } : { card };
		},
	};
};

function Component() {
	return (
		<LabContainer
			overlay={(ref) => (
				<SpamBar
					buttons={[
						{
							id: "fo-bar-next",
							label: "next",
							onPress: () => {
								const name = ref.getCurrentRoute()?.name;
								const next = CHAIN[CHAIN.indexOf(name) + 1];
								if (next) ref.dispatch(StackActions.push(next));
							},
						},
						{ id: "fo-bar-back", label: "back", onPress: () => ref.canGoBack() && ref.goBack() },
					]}
				/>
			)}
		>
			<Stack.Navigator>
				<Stack.Screen name="List" component={List} />
				<Stack.Screen name="Detail" component={Detail} options={() => detailFor("Detail")} />
				<Stack.Screen name="Theater" component={Theater} options={() => detailFor("Theater")} />
				<Stack.Screen name="Gallery" component={Gallery} options={() => detailFor("Gallery")} />
				<Stack.Screen name="Profile" component={Profile} options={() => detailFor("Profile")} />
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "follow",
	title: "follow",
	covers: "A shared bound on screens that move (slide + parallax, scale): the card should be one card the whole way, with no offset",
	Component,
};
