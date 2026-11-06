// @ts-nocheck
/**
 * follow: a shared bound on screens that move. The detail slides in from the right while the list
 * parallaxes left (the stack's usual slide), and a horizontal swipe drags the detail back. The card
 * is styled with `bounds("card").styles()` and nothing else: no offset. Both copies of the card
 * draw (the list's and the detail's), so any disagreement shows as two cards.
 *   fo-mode-slide   content translateX (slide + parallax)
 *   fo-mode-scale   the detail also scales while it moves (a card-like screen)
 *   fo-mode-still   the screens don't move (the reference: only the bound animates)
 *   fo-method       toggles transform / size
 *   fo-card         opens the detail; fo-next pushes the theater (the card hands on to a third slot);
 *                   fo-back / fo-back-2 close them; swipe right from the left edge drags the top one
 *   bar (fixed, for spam): fo-bar-next pushes the next screen (List -> Detail -> Theater),
 *                   fo-bar-back pops; their positions never move
 *
 * What to look at: one card the whole way. It leaves the list's slot and lands on the detail's slot
 * as the detail arrives, follows the detail while it is dragged, and lands back on the list's slot;
 * the same along the chain, and under any spam of next/back/drags.
 */
import { StackActions } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { makeMutable } from "react-native-reanimated";
import { Button, createBlankStackNavigator, interpolate, type Lab, LabContainer, Probe, SPEC, SpamBar, Transition } from "./ui";

const Stack = createBlankStackNavigator();
const mode = makeMutable("slide");
const method = makeMutable("transform");
const MODES = ["slide", "scale", "still"];

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
	return (
		<View style={{ flex: 1, backgroundColor: "#111827", paddingTop: 110, paddingHorizontal: 20, gap: 12 }}>
			<Text style={{ color: "white", fontSize: 30, fontWeight: "800" }}>follow</Text>
			<View style={{ flexDirection: "row", gap: 8 }}>
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
			<Probe testID="fo-state" value={`mode:${current} method:${m}`} />
			<Transition.Boundary
				id="card"
				testID="fo-card"
				accessibilityLabel="fo-card"
				onPress={() => navigation.push("Detail")}
				style={{ width: width * 0.4, height: width * 0.5, marginTop: 80 }}
			>
				<Card />
			</Transition.Boundary>
		</View>
	);
}

function Detail({ navigation }) {
	const { width } = useWindowDimensions();
	return (
		<View style={{ flex: 1, backgroundColor: "#1e293b", paddingTop: 100, paddingHorizontal: 20, gap: 16 }}>
			<Transition.Boundary id="card" style={{ width: width * 0.4, height: width * 0.5, alignSelf: "flex-end" }}>
				<Card color="#38bdf8" />
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
			<Transition.Boundary id="card" style={{ width: width * 0.4, height: width * 0.5, marginTop: 120 }}>
				<Card color="#22c55e" />
			</Transition.Boundary>
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

const detail = {
	gestureEnabled: true,
	gestureDirection: "horizontal",
	transitionSpec: { open: SPEC, close: SPEC },
	screenStyleInterpolator: ({ progress, bounds, layouts: { screen } }) => {
		"worklet";
		const m = mode.get();
		const card = { style: bounds("card").styles(method.get() === "size" ? { method: "size" } : undefined) };
		if (m === "still") return { card };
		const x = interpolate(progress, [0, 1, 2], [screen.width, 0, -screen.width * 0.3]);
		const transform = [{ translateX: x }];
		if (m === "scale") transform.push({ scale: interpolate(progress, [0, 1, 2], [0.8, 1, 0.9]) });
		return { content: { style: { transform } }, card };
	},
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
								if (name === "List") ref.dispatch(StackActions.push("Detail"));
								else if (name === "Detail") ref.dispatch(StackActions.push("Theater"));
							},
						},
						{ id: "fo-bar-back", label: "back", onPress: () => ref.canGoBack() && ref.goBack() },
					]}
				/>
			)}
		>
			<Stack.Navigator>
				<Stack.Screen name="List" component={List} />
				<Stack.Screen name="Detail" component={Detail} options={detail} />
				<Stack.Screen name="Theater" component={Theater} options={detail} />
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
