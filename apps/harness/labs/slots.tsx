// @ts-nocheck
/**
 * slots: covers interpolator style slots. `Transition.View styleId="hero"` on A and B
 * picks up the `hero` slot, and the slot is reset to identity once the interpolator
 * stops returning it or stops returning one of its keys. The Custom screen covers
 * the layer renderers: contentComponent and surfaceComponent (each receives
 * {styles, props, pointerEvents, children}), plus a backdropComponent driven by
 * the `content`, `surface` and `backdrop` slots.
 *
 * Modes (module-level shared value read by the interpolator):
 *   throughout  hero slot returned every frame (scale/opacity, identity at rest)
 *   animating   hero slot returned only while !active.settled (the style-reset case)
 *   keys        hero slot adds backgroundColor (yellow frame) only while progress < 1
 * In every mode the hero must show no leftover scale, opacity or yellow frame at rest.
 * Measuring the box: on iOS Fabric measureInWindow should include ancestor transforms,
 * so a leftover scale shows up as a size below 160x160.
 *
 * Argent loop:
 *  1. Open lab (open-slots). Expect slots-a, slots-mode "mode:throughout".
 *  2. Tap slots-push-b. During the push the B hero grows from half size and fades in.
 *     After 1s expect slots-b. Tap slots-measure-b, expect slots-hero-b-layout
 *     "hero:160x160@..." and a full-opacity white box with no yellow frame.
 *  3. Tap slots-back, expect slots-a. Tap slots-measure-a, expect "hero:160x160@...".
 *  4. Tap slots-mode-animating (expect mode:animating) and repeat 2-3: same results at
 *     rest (the slot is dropped once settled and the library resets it).
 *  5. Tap slots-mode-keys (expect mode:keys) and repeat 2-3: a yellow frame shows around
 *     the B hero while the push runs and is gone at rest (backgroundColor reset).
 *  6. Tap slots-push-custom. Expect slots-custom as a card with a yellow border,
 *     140pt below the top, with A dimmed behind it (the black backdrop at 60%).
 *     Expect slots-content-layer, slots-surface-layer and slots-backdrop-layer present.
 *  7. Tap slots-back on Custom, expect slots-a undimmed with no leftover layers.
 */
import { useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, { makeMutable } from "react-native-reanimated";
import { Button, createBlankStackNavigator, interpolate, LabContainer, Page, Probe, SPEC, Transition, type Lab } from "./ui";

const Stack = createBlankStackNavigator();

const MODES = ["throughout", "animating", "keys"] as const;
const MODE = makeMutable<string>("throughout");

const heroOptions = {
	gestureEnabled: true,
	gestureDirection: "horizontal",
	transitionSpec: { open: SPEC, close: SPEC },
	screenStyleInterpolator: ({ progress, active, layouts: { screen } }) => {
		"worklet";
		const content = { transform: [{ translateX: interpolate(progress, [0, 1, 2], [screen.width, 0, -screen.width * 0.3]) }] };
		const away = Math.min(Math.abs(progress - 1), 1); // 0 at rest, 1 fully off screen
		const hero = { opacity: 1 - 0.7 * away, transform: [{ scale: 1 - 0.5 * away }] };
		switch (MODE.value) {
			case "animating":
				return active.settled ? { content } : { content, hero };
			case "keys":
				return { content, hero: progress < 1 ? { ...hero, backgroundColor: "#facc15" } : hero };
			default:
				return { content, hero };
		}
	},
};

// Render-style layer components: the library passes the slot's animated styles in.
function ContentLayer({ styles, props, pointerEvents, children }) {
	return (
		<Animated.View testID="slots-content-layer" style={styles} animatedProps={props} pointerEvents={pointerEvents}>
			{children}
		</Animated.View>
	);
}

function SurfaceLayer({ styles, props, pointerEvents, children }) {
	const card = { marginTop: 140, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 4, borderColor: "#facc15", overflow: "hidden" };
	return (
		<Animated.View testID="slots-surface-layer" style={[styles, card]} animatedProps={props} pointerEvents={pointerEvents}>
			{children}
		</Animated.View>
	);
}

function BackdropLayer({ styles, props, pointerEvents }) {
	return <Animated.View testID="slots-backdrop-layer" style={[styles, { backgroundColor: "black" }]} animatedProps={props} pointerEvents={pointerEvents} />;
}

const customOptions = {
	gestureEnabled: true,
	gestureDirection: "vertical",
	transitionSpec: { open: SPEC, close: SPEC },
	contentComponent: ContentLayer,
	surfaceComponent: SurfaceLayer,
	backdropComponent: BackdropLayer,
	screenStyleInterpolator: ({ progress, layouts: { screen } }) => {
		"worklet";
		return {
			content: { transform: [{ translateY: interpolate(progress, [0, 1], [screen.height, 0], "clamp") }] },
			surface: { opacity: interpolate(progress, [0, 1], [0.3, 1], "clamp") },
			backdrop: { opacity: interpolate(progress, [0, 1], [0, 0.6], "clamp") },
		};
	},
};

/** The hero: a padded transparent Transition.View (so a backgroundColor key shows as a frame) around a 160x160 box. */
function Hero({ screen, offset = 0 }) {
	const box = useRef(null);
	const [layout, setLayout] = useState("hero:unmeasured");
	const measure = () =>
		box.current?.measureInWindow((x, y, w, h) => setLayout(`hero:${Math.round(w)}x${Math.round(h)}@${Math.round(x)},${Math.round(y)}`));
	return (
		<>
			<Transition.View styleId="hero" style={{ alignSelf: "center", marginTop: offset, padding: 10, borderRadius: 22 }}>
				<View ref={box} collapsable={false} testID={`slots-hero-${screen}`} style={{ width: 160, height: 160, borderRadius: 14, backgroundColor: "white", alignItems: "center", justifyContent: "center" }}>
					<Text style={{ fontSize: 22, fontWeight: "800" }}>hero {screen.toUpperCase()}</Text>
					<Text style={{ fontSize: 12, color: "#555" }}>160x160 at rest</Text>
				</View>
			</Transition.View>
			<Probe testID={`slots-hero-${screen}-layout`} value={layout} />
			<Button label="measure hero" testID={`slots-measure-${screen}`} onPress={measure} />
		</>
	);
}

function A({ navigation }) {
	const [mode, setMode] = useState(MODE.value);
	const choose = (next: string) => {
		MODE.value = next;
		setMode(next);
	};
	return (
		<Page title="A" testID="slots-a">
			<Probe testID="slots-mode" value={`mode:${mode}`} />
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
				{MODES.map((m) => (
					<Button key={m} label={m} testID={`slots-mode-${m}`} onPress={() => choose(m)} />
				))}
			</View>
			<Hero screen="a" />
			<Button label="push B" testID="slots-push-b" onPress={() => navigation.push("B")} />
			<Button label="push Custom (layers)" testID="slots-push-custom" onPress={() => navigation.push("Custom")} />
		</Page>
	);
}

function B({ navigation }) {
	return (
		<Page title="B" testID="slots-b">
			<Probe testID="slots-mode-b" value={`mode:${MODE.value}`} />
			<Hero screen="b" offset={60} />
			<Button label="back" testID="slots-back" onPress={() => navigation.goBack()} />
		</Page>
	);
}

function Custom({ navigation }) {
	return (
		<Page title="Custom" testID="slots-custom">
			<Probe testID="slots-layers" value="layers:content+surface+backdrop" />
			<Button label="back" testID="slots-back" onPress={() => navigation.goBack()} />
		</Page>
	);
}

function Component() {
	const opened = useRef(false);
	if (!opened.current) {
		opened.current = true;
		MODE.value = "throughout";
	}
	return (
		<LabContainer>
			<Stack.Navigator>
				<Stack.Screen name="A" component={A} options={heroOptions} />
				<Stack.Screen name="B" component={B} options={heroOptions} />
				<Stack.Screen name="Custom" component={Custom} options={customOptions} />
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "slots",
	title: "slots",
	covers: "styleId slots (always / only while animating / keys changing mid-transition) reset at rest; contentComponent, surfaceComponent, backdropComponent",
	Component,
};
