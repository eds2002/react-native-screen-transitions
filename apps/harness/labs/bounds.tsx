// @ts-nocheck
/**
 * bounds: shared-element boundaries. One grid of four Transition.Boundary tiles
 * (ids a–d, group "tiles") pushes one of five destinations, picked by the mode
 * buttons. Each destination exercises one bounds API with one plain interpolator:
 *   zoom   bounds({ id, group }).navigation.zoom()   Specs.Zoom, swipe + pinch dismiss
 *   bound  navigation.zoom({ target: "bound" })      lands on a destination boundary
 *   morph  { [group:id]: bounds().styles() }         tile rect -> larger rect, body fades in
 *   reveal navigation.reveal()                       clip reveal from the tile
 *   pager  zoom target "bound" in a paging list      setParams({ id }) retargets the dismiss
 * Boundaries escape clipping through react-native-teleport (installed in the harness app).
 *
 * Argent loop (open-bounds first; probes read "key:value"):
 *  1. read bounds-mode → "mode:zoom"; bounds-grid shows bounds-tile-a..d
 *  2. tap bounds-tile-b → zoom grows from tile b; bounds-route "route:zoom id:b"
 *  3. pinch in at center → back on grid, tile b visible in place; bounds-last "last:b"
 *  4. tap bounds-tile-c, swipe down from center → back on grid, tile c in place
 *  5. tap bounds-mode-bound, tap bounds-tile-a → zoom lands on bounds-dest-a (wide rect)
 *  6. swipe right from left third → shrinks back into tile a
 *  7. tap bounds-mode-morph, tap bounds-tile-d → tile d moves/grows into the top rect,
 *     bounds-morph-title fades in over a dimmed grid; route:morph id:d
 *  8. tap bounds-back → rect shrinks back into tile d, body fades out
 *  9. tap bounds-mode-reveal, tap bounds-tile-b → screen reveals from tile b; route:reveal id:b
 * 10. swipe down from center → screen collapses back into tile b
 * 11. tap bounds-mode-pager, tap bounds-tile-a → bounds-page-a; bounds-route "route:pager id:a"
 * 12. swipe left twice on the page body → bounds-page-c; bounds-route "route:pager id:c"
 * 13. tap bounds-back (or swipe down) → zoom closes into tile c (not a); bounds-last "last:a"
 */
import { useState } from "react";
import { FlatList, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, colorFor, createBlankStackNavigator, interpolate, LabContainer, Page, Probe, SPEC, Transition, type Lab } from "./ui";

const GROUP = "tiles";
const TILES = ["a", "b", "c", "d"];
const MODES = ["zoom", "bound", "morph", "reveal", "pager"];
const Stack = createBlankStackNavigator();
const ZoomFlatList = Transition.FlatList as typeof FlatList;

/** The tile id of whichever route in the pair carries one. */
const routeId = ({ active, current, next }) => {
	"worklet";
	return active?.route?.params?.id ?? next?.route?.params?.id ?? current?.route?.params?.id ?? "";
};

const zoomOptions = (target) => ({
	gestureEnabled: true,
	gestureDirection: ["bidirectional", "pinch-in"],
	transitionSpec: Transition.Specs.Zoom,
	screenStyleInterpolator: (props) => {
		"worklet";
		const id = routeId(props);
		if (!id) return {};
		return props.bounds({ id, group: GROUP }).navigation.zoom(target ? { target } : undefined);
	},
});

const morphOptions = {
	gestureEnabled: true,
	gestureDirection: "vertical",
	transitionSpec: { open: SPEC, close: SPEC },
	screenStyleInterpolator: (props) => {
		"worklet";
		const { bounds, progress, focused } = props;
		const id = routeId(props);
		if (!id) return {};
		return {
			// The same tag styles the source tile (unfocused) and the destination rect (focused).
			[`${GROUP}:${id}`]: {
				...bounds({ id, group: GROUP }).styles(),
				opacity: focused ? interpolate(progress, [0, 1], [0, 1], "clamp") : interpolate(progress, [1, 2], [1, 0], "clamp"),
			},
			"morph-body": { opacity: interpolate(progress, [0.5, 1], [0, 1], "clamp") },
			backdrop: focused ? { style: { backgroundColor: "black", opacity: interpolate(progress, [0, 1], [0, 0.85], "clamp") } } : undefined,
		};
	},
};

const revealOptions = {
	gestureEnabled: true,
	gestureDirection: ["vertical", "horizontal", "vertical-inverted"],
	transitionSpec: { open: SPEC, close: SPEC },
	screenStyleInterpolator: (props) => {
		"worklet";
		const id = routeId(props);
		if (!id) return {};
		return props.bounds({ id, group: GROUP }).navigation.reveal();
	},
};

function Grid({ navigation }) {
	const { width } = useWindowDimensions();
	const [mode, setMode] = useState("zoom");
	const [last, setLast] = useState("-");
	const size = (width - 40 - 10) / 2;
	return (
		<Page title="bounds" testID="bounds-grid" color="#111827">
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
				{MODES.map((m) => (
					<Button key={m} label={m === mode ? `• ${m}` : m} testID={`bounds-mode-${m}`} onPress={() => setMode(m)} />
				))}
			</View>
			<Probe testID="bounds-mode" value={`mode:${mode}`} />
			<Probe testID="bounds-last" value={`last:${last}`} />
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
				{TILES.map((id) => (
					<Transition.Boundary
						key={id}
						id={id}
						group={GROUP}
						testID={`bounds-tile-${id}`}
						accessibilityLabel={`bounds-tile-${id}`}
						onPress={() => {
							setLast(id);
							navigation.push(mode, { id });
						}}
						style={{ width: size, height: size * 0.8, borderRadius: 20, backgroundColor: colorFor(id), justifyContent: "flex-end", padding: 14 }}
					>
						<Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>{id}</Text>
					</Transition.Boundary>
				))}
			</View>
		</Page>
	);
}

/** A destination boundary that pairs with tile `id`. */
function DestBoundary({ id, height = 240 }) {
	return (
		<Transition.Boundary id={id} group={GROUP} testID={`bounds-dest-${id}`} style={{ height, borderRadius: 28, backgroundColor: colorFor(id), justifyContent: "flex-end", padding: 18 }}>
			<Text style={{ color: "white", fontSize: 40, fontWeight: "800" }}>{id}</Text>
		</Transition.Boundary>
	);
}

function Footer({ name, id, navigation }) {
	return (
		<>
			<Probe testID="bounds-route" value={`route:${name} id:${id}`} />
			<Button label="Back" testID="bounds-back" onPress={() => navigation.goBack()} />
		</>
	);
}

function ZoomScreen({ navigation, route }) {
	const { id } = route.params;
	return (
		<Page title={`zoom ${id}`} testID="bounds-zoom" color={colorFor(id)}>
			<Text style={{ color: "white" }}>No destination boundary: zoom uses its native full-width target. Swipe any way or pinch in to dismiss.</Text>
			<Footer name="zoom" id={id} navigation={navigation} />
		</Page>
	);
}

function BoundScreen({ navigation, route }) {
	const { id } = route.params;
	return (
		<Page title={`bound ${id}`} testID="bounds-bound" color="#0b0b0f">
			<DestBoundary id={id} />
			<Footer name="bound" id={id} navigation={navigation} />
		</Page>
	);
}

function MorphScreen({ navigation, route }) {
	const { id } = route.params;
	const insets = useSafeAreaInsets();
	return (
		<View testID="bounds-morph" style={{ flex: 1, paddingTop: insets.top + 56, paddingHorizontal: 20, gap: 12 }}>
			<DestBoundary id={id} height={320} />
			<Transition.View styleId="morph-body" style={{ gap: 10 }}>
				<Text testID="bounds-morph-title" style={{ color: "white", fontSize: 34, fontWeight: "800" }}>
					{`morph ${id}`}
				</Text>
				<Footer name="morph" id={id} navigation={navigation} />
			</Transition.View>
		</View>
	);
}

function RevealScreen({ navigation, route }) {
	const { id } = route.params;
	return (
		<Page title={`reveal ${id}`} testID="bounds-reveal" color="#0b0b0f">
			<DestBoundary id={id} height={200} />
			<Text style={{ color: "white" }}>Swipe down, sideways or up to collapse back into the tile.</Text>
			<Footer name="reveal" id={id} navigation={navigation} />
		</Page>
	);
}

function PagerScreen({ navigation, route }) {
	const { id } = route.params;
	const { width } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const initialIndex = Math.max(0, TILES.indexOf(id));
	return (
		<View testID="bounds-pager" style={{ flex: 1, backgroundColor: "#0b0b0f" }}>
			<ZoomFlatList
				data={TILES}
				keyExtractor={(item) => item}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				initialScrollIndex={initialIndex}
				getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
				onMomentumScrollEnd={(e) => {
					const next = TILES[Math.round(e.nativeEvent.contentOffset.x / width)];
					if (next && next !== route.params.id) navigation.setParams({ id: next });
				}}
				renderItem={({ item }) => (
					<View testID={`bounds-page-${item}`} style={{ width, paddingTop: insets.top + 56, paddingHorizontal: 20, gap: 10 }}>
						<Text style={{ color: "white", fontSize: 34, fontWeight: "800" }}>{`page ${item}`}</Text>
						<DestBoundary id={item} height={280} />
					</View>
				)}
			/>
			<View style={{ position: "absolute", left: 20, right: 20, bottom: insets.bottom + 24, gap: 10 }}>
				<Footer name="pager" id={id} navigation={navigation} />
			</View>
		</View>
	);
}

function Component() {
	return (
		<LabContainer>
			<Stack.Navigator>
				<Stack.Screen name="grid" component={Grid} />
				<Stack.Screen name="zoom" component={ZoomScreen} options={zoomOptions()} />
				<Stack.Screen name="bound" component={BoundScreen} options={zoomOptions("bound")} />
				<Stack.Screen name="morph" component={MorphScreen} options={morphOptions} />
				<Stack.Screen name="reveal" component={RevealScreen} options={revealOptions} />
				<Stack.Screen name="pager" component={PagerScreen} options={zoomOptions("bound")} />
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "bounds",
	title: "bounds",
	covers: "Boundary tiles → zoom (swipe/pinch), zoom to bound, styles() morph, reveal, group retarget via setParams",
	Component,
};
