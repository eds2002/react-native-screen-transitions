// @ts-nocheck
/**
 * Shared pieces for harness labs. Every lab is one screen family exercising
 * one library mechanism with one plain interpolator; everything Argent needs
 * to drive or read has a testID (see README.md for the conventions).
 */
import { DefaultTheme, NavigationContainer, NavigationIndependentTree, NavigationRouteContext, useNavigationContainerRef } from "@react-navigation/native";
import { type ReactNode, useContext } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { createBlankStackNavigator } from "react-native-screen-transitions/react-navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { bridge, ScreenReporter } from "./bridge";
import { BLANK } from "./stamp";

/** Navigator backgrounds are the blank color too, so anything they show counts as blank. */
const THEME = { ...DefaultTheme, dark: true, colors: { ...DefaultTheme.colors, background: BLANK } };

export { createBlankStackNavigator, interpolate, Transition };

export const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c", "#0891b2", "#be185d", "#4d7c0f"];
export const colorFor = (name: string) => COLORS[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % COLORS.length];

export const SPEC = Transition.Specs.DefaultSpec;

/** The one slide every lab uses unless it tests something else: from the right, previous screen parallaxes. */
export const slide = (direction: "horizontal" | "vertical" = "horizontal", extra = {}) => ({
	gestureEnabled: true,
	gestureDirection: direction,
	transitionSpec: { open: SPEC, close: SPEC },
	screenStyleInterpolator: ({ progress, layouts: { screen } }) => {
		"worklet";
		const size = direction === "horizontal" ? screen.width : screen.height;
		const offset = interpolate(progress, [0, 1, 2], [size, 0, -size * 0.3]);
		return { content: { style: { transform: [direction === "horizontal" ? { translateX: offset } : { translateY: offset }] } } };
	},
	...extra,
});

/** A bottom sheet with these snap points. */
export const sheet = (snapPoints = [0.4, 0.7, 1], extra = {}) => ({
	gestureEnabled: true,
	gestureDirection: "vertical",
	snapPoints,
	initialSnapIndex: 0,
	transitionSpec: { open: SPEC, close: SPEC },
	screenStyleInterpolator: ({ progress, layouts: { screen } }) => {
		"worklet";
		return { content: { style: { transform: [{ translateY: interpolate(progress, [0, 1], [screen.height, 0], "clamp") }] } } };
	},
	...extra,
});

/** A full-screen page: color, big title (testID `<testID>-title`), then children. */
export function Page({ title, testID, color, children, scroll }: { title: string; testID: string; color?: string; children?: ReactNode; scroll?: boolean }) {
	const insets = useSafeAreaInsets();
	const route = useContext(NavigationRouteContext);
	const body = (
		<View style={{ paddingTop: insets.top + 56, paddingHorizontal: 20, paddingBottom: insets.bottom + 24, gap: 10 }}>
			<Text testID={`${testID}-title`} style={{ color: "white", fontSize: 34, fontWeight: "800" }}>
				{title}
			</Text>
			{children}
		</View>
	);
	return (
		<View testID={testID} style={{ flex: 1, backgroundColor: color ?? colorFor(title) }}>
			<ScreenReporter routeKey={route?.key} name={route?.name} />
			{scroll ? <ScrollView>{body}</ScrollView> : body}
		</View>
	);
}

export function Button({ label, testID, onPress }: { label: string; testID: string; onPress: () => void }) {
	return (
		<Pressable testID={testID} accessibilityLabel={testID} onPress={onPress} style={{ backgroundColor: "#0008", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 }}>
			<Text style={{ color: "white", fontWeight: "700" }}>{label}</Text>
		</Pressable>
	);
}

/** Readable state for Argent (`<testID>` holds "key:value"). */
export function Probe({ testID, value }: { testID: string; value: string }) {
	return (
		<Text testID={testID} style={{ color: "#fffd", fontFamily: "Menlo", fontSize: 13 }}>
			{value}
		</Text>
	);
}

/**
 * Wraps a lab's own navigator so it is independent of the app shell; reports its state to the bridge.
 * `overlay(ref)` renders above the navigator (fixed controls that drive it through the container ref).
 */
export function LabContainer({ children, overlay }: { children: ReactNode; overlay?: (ref) => ReactNode }) {
	const ref = useNavigationContainerRef();
	return (
		<NavigationIndependentTree>
			<NavigationContainer theme={THEME} ref={ref} onReady={() => bridge.setNav(ref.getRootState())} onStateChange={(state) => bridge.setNav(state)}>
				{children}
			</NavigationContainer>
			{overlay?.(ref)}
		</NavigationIndependentTree>
	);
}

export type Lab = { id: string; title: string; covers: string; Component: () => ReactNode };
