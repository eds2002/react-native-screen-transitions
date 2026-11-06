// @ts-nocheck
/**
 * scrollbounds: shared bounds whose source sits in a scrolled list and whose destination scrolls.
 * A Transition.ScrollView of cards (Boundary ids 1–12, group "list") zooms into a scrolling detail.
 * The destination boundary has the cards' 5:4 aspect ratio, so a zoom only scales and moves (any
 * bend in the path is the bug, not a shape change). Mode buttons pick the zoom: zoom, bound (zoom({ target: "bound" })), visible (zoom({
 * keepFocusedVisible })). Debug (on by default): a slow spring, the destination held at 60% opacity
 * (no landing fade), no backdrop and no background shrink, so both screens stay visible and the
 * landing can be compared with the card.
 *
 * The detail's bar: Back; "move list" scrolls the list underneath (as if rows changed while covered);
 * "Back + scroll" pops and scrolls the list during the close (a flick right after Back).
 *
 * Argent loop (open harness://lab/scrollbounds):
 *  1. swipe up on the list (0.5,0.8 → 0.5,0.55), tap sb-card-5 → the detail grows out of card 5
 *  2. swipe up on the detail (0.5,0.75 → 0.5,0.5), tap sb-back → it should shrink straight into card 5,
 *     with no jump as the close starts
 *  3. tap sb-card-5, tap sb-move-list, tap sb-back → it should land on card 5 where it is now
 *  4. tap sb-card-5, tap sb-back-scroll → it should follow card 5 as the list scrolls
 */
import { useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { Button, colorFor, createBlankStackNavigator, LabContainer, Transition, type Lab } from "./ui";

const GROUP = "list";
const CARDS = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
const Stack = createBlankStackNavigator();
const listRef = { current: null };
const listOffset = { current: 0 };

const SLOW = { stiffness: 60, damping: 20, mass: 1.6, overshootClamping: true };

const routeId = (props) => {
	"worklet";
	return props.active?.route?.params?.id ?? props.next?.route?.params?.id ?? props.current?.route?.params?.id ?? "";
};

const zoomOptions = (mode, debug) => ({
	gestureEnabled: true,
	gestureDirection: ["bidirectional", "pinch-in"],
	transitionSpec: debug ? { open: SLOW, close: SLOW } : Transition.Specs.Zoom,
	screenStyleInterpolator: (props) => {
		"worklet";
		const id = routeId(props);
		if (!id) return {};
		const result = props.bounds({ id, group: GROUP }).navigation.zoom({
			...(mode === "bound" ? { target: "bound" } : {}),
			...(mode === "visible" ? { keepFocusedVisible: true } : {}),
			...(debug ? { backdropOpacity: 0, backgroundScale: 1 } : {}),
		});
		// Debug: hold the destination at 60% so the list (and the card) show through it.
		if (debug && props.focused && result.content?.style) {
			return { ...result, content: { ...result.content, style: { ...result.content.style, opacity: 0.6 } } };
		}
		return result;
	},
});

function List({ navigation }) {
	// Mode lives here and travels in the route params: Blank Stack reuses a screen's render while its
	// options are unchanged, so state held above the navigator never reaches the screens.
	const [mode, setMode] = useState("zoom");
	const [debug, setDebug] = useState(true);
	const { width } = useWindowDimensions();
	const size = (width - 40 - 10) / 2;
	return (
		<View style={{ flex: 1, backgroundColor: "#111827" }}>
			<Transition.ScrollView
				ref={listRef}
				scrollEventThrottle={16}
				onScroll={(e) => {
					listOffset.current = e.nativeEvent.contentOffset.y;
				}}
				contentContainerStyle={{ paddingTop: 110, paddingHorizontal: 20, paddingBottom: 500, gap: 10 }}
			>
				<Text style={{ color: "white", fontSize: 30, fontWeight: "800" }}>scroll + bounds</Text>
				<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
					{["zoom", "bound", "visible"].map((m) => (
						<Button key={m} label={m === mode ? `• ${m}` : m} testID={`sb-mode-${m}`} onPress={() => setMode(m)} />
					))}
					<Button label={debug ? "• debug" : "debug"} testID="sb-debug" onPress={() => setDebug(!debug)} />
				</View>
				<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
					{CARDS.map((id) => (
						<Transition.Boundary
							key={id}
							id={id}
							group={GROUP}
							testID={`sb-card-${id}`}
							accessibilityLabel={`sb-card-${id}`}
							onPress={() => navigation.push("detail", { id, mode, debug })}
							style={{ width: size, height: size * CARD_RATIO, borderRadius: 20, backgroundColor: colorFor(`card${id}`), justifyContent: "flex-end", padding: 14 }}
						>
							<Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>{id}</Text>
						</Transition.Boundary>
					))}
				</View>
			</Transition.ScrollView>
		</View>
	);
}

function BarButton({ label, testID, onPress }) {
	return (
		<Pressable testID={testID} accessibilityLabel={testID} onPress={onPress} style={{ backgroundColor: "#000c", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 }}>
			<Text style={{ color: "white", fontWeight: "800" }}>{label}</Text>
		</Pressable>
	);
}

/** Cards are 5:4; the destination boundary keeps that aspect ratio, so a zoom only scales and moves. */
const CARD_RATIO = 0.8;

function Detail({ navigation, route }) {
	const { id, mode } = route.params;
	const bound = mode === "bound";
	const { width } = useWindowDimensions();
	const Card = bound ? Transition.Boundary : View;
	return (
		<View style={{ flex: 1, backgroundColor: "#0b0b0f" }}>
			<Transition.ScrollView contentContainerStyle={{ paddingTop: 120, paddingHorizontal: 20, paddingBottom: 1200, gap: 14 }}>
				<Card {...(bound ? { id, group: GROUP } : {})} testID="sb-dest" style={{ height: (width - 40) * CARD_RATIO, borderRadius: 28, backgroundColor: colorFor(`card${id}`), justifyContent: "flex-end", padding: 18 }}>
					<Text style={{ color: "white", fontSize: 44, fontWeight: "800" }}>{id}</Text>
				</Card>
				{Array.from({ length: 14 }, (_, i) => (
					<View key={i} style={{ height: 56, borderRadius: 14, backgroundColor: "#ffffff14" }} />
				))}
			</Transition.ScrollView>
			<View style={{ position: "absolute", top: 60, left: 16, right: 16, flexDirection: "row", gap: 8 }}>
				<BarButton label="Back" testID="sb-back" onPress={() => navigation.goBack()} />
				<BarButton label="move list" testID="sb-move-list" onPress={() => listRef.current?.scrollTo?.({ y: listOffset.current + 300, animated: false })} />
				<BarButton
					label="Back + scroll"
					testID="sb-back-scroll"
					onPress={() => {
						const from = listOffset.current;
						navigation.goBack();
						setTimeout(() => listRef.current?.scrollTo?.({ y: from + 300, animated: true }), 120);
					}}
				/>
			</View>
		</View>
	);
}

function Component() {
	return (
		<LabContainer>
			<Stack.Navigator>
				<Stack.Screen name="list" component={List} />
				<Stack.Screen name="detail" component={Detail} options={({ route }) => zoomOptions(route.params.mode, route.params.debug)} />
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "scrollbounds",
	title: "scrollbounds",
	covers: "Shared bounds + scroll: zoom / zoom-to-bound / keepFocusedVisible from a scrolled list into a scrolling detail; debug view (slow, no fade); list moving or scrolling under the close",
	Component,
};
