// @ts-nocheck
/**
 * realms: a demo of shared bounds with handoff over screens that each arrive their own way.
 *
 * Wisp, a little light, travels Home → Meadow → Lagoon → Ember → Summit. Wisp is one live view
 * (handoff) handed from slot to slot: a portrait card at home, a hero on Meadow, a small badge on
 * Lagoon, a banner on Ember, a stage on Summit. Its halo, blink and orbiting motes never restart.
 * Every realm arrives on a diagonal with a springy scale and a tilt, each from its own corner; the
 * screen below drifts away from it, dims and shrinks, and each realm's scenery moves in layers
 * (nearer layers travel further). Summit's Home pops straight back to the start.
 *
 * Testids: rl-wisp (home, opens Meadow), rl-next, rl-back, rl-home (Summit, pops to the start).
 */
import { useEffect, useMemo } from "react";
import {
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { useScreenAnimation } from "react-native-screen-transitions";
import {
	createBlankStackNavigator,
	interpolate,
	type Lab,
	LabContainer,
	Transition,
} from "./ui";

const Stack = createBlankStackNavigator();

/** Where each realm comes from (fractions of the screen) and the tilt it arrives with. */
const ARRIVE = {
	Home: { x: 0, y: 0, r: 0 },
	Meadow: { x: 1, y: 0.34, r: -8 },
	Lagoon: { x: -1, y: -0.34, r: 8 },
	Ember: { x: -1, y: 0.34, r: 8 },
	Summit: { x: 1, y: -0.34, r: -8 },
};
const ORDER = ["Home", "Meadow", "Lagoon", "Ember", "Summit"];
/** A soft spring with a little overshoot: realms land with a bounce. */
const SPRING = { stiffness: 170, damping: 19, mass: 1 };
/**
 * Leaving is quicker and never overshoots (critically damped): a close that dipped past its start
 * would carry the shared card past its slot and keep the pair alive until the wobble settled.
 * Damping, not overshootClamping: a clamped spring released from a drag starts its close from the
 * open position for a frame.
 */
const CLOSE = { stiffness: 260, damping: 34, mass: 1 };
/** How far the screen below drifts away from an arriving realm. */
const DRIFT = 0.2;

/** A screen's motion this frame: arriving (current) and being covered (next), as offsets. */
const motionOf = (name, current, next, screen) => {
	"worklet";
	const a = ARRIVE[name];
	const n = next ? (ARRIVE[next.route.name] ?? ARRIVE.Meadow) : null;
	const enter = 1 - current.progress;
	const cover = next ? next.progress : 0;
	return {
		x:
			enter * a.x * screen.width - (n ? n.x * cover * screen.width * DRIFT : 0),
		y:
			enter * a.y * screen.height -
			(n ? n.y * cover * screen.height * DRIFT : 0),
		r: enter * a.r - (n ? n.r * cover * 0.5 : 0),
		enter,
		cover,
	};
};

const realmOptions = (name) => ({
	gestureEnabled: name !== "Home",
	// Swipe back the way the realm came in.
	gestureDirection: ARRIVE[name].x < 0 ? "horizontal-inverted" : "horizontal",
	transitionSpec: { open: SPRING, close: CLOSE },
	screenStyleInterpolator: ({ current, next, layouts: { screen }, bounds }) => {
		"worklet";
		const m = motionOf(name, current, next, screen);
		const scale =
			interpolate(m.enter, [0, 1], [1, 0.5]) *
			interpolate(m.cover, [0, 1], [1, 0.84]);
		return {
			content: {
				style: {
					transform: [
						{ translateX: m.x },
						{ translateY: m.y },
						{ rotate: `${m.r}deg` },
						{ scale },
					],
				},
			},
			backdrop: {
				style: {
					backgroundColor: "#03030a",
					opacity: interpolate(m.enter, [0, 1], [0.55, 0], "clamp"),
				},
			},
			wisp: { style: bounds("wisp").styles({ method: "size" }) },
		};
	},
});

// ---------------------------------------------------------------- Wisp (the handed-off live view)

function Wisp() {
	const spin = useSharedValue(0);
	const pulse = useSharedValue(0);
	const blink = useSharedValue(1);
	useEffect(() => {
		spin.set(
			withRepeat(withTiming(1, { duration: 5200, easing: Easing.linear }), -1),
		);
		pulse.set(
			withRepeat(
				withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
				-1,
				true,
			),
		);
		blink.set(
			withRepeat(
				withSequence(
					withDelay(2400, withTiming(0.1, { duration: 80 })),
					withTiming(1, { duration: 110 }),
				),
				-1,
			),
		);
	}, [spin, pulse, blink]);
	const haloNear = useAnimatedStyle(() => ({
		opacity: 0.35 + pulse.get() * 0.2,
		transform: [{ scale: 1.12 + pulse.get() * 0.12 }],
	}));
	const haloFar = useAnimatedStyle(() => ({
		opacity: 0.12 + pulse.get() * 0.12,
		transform: [{ scale: 1.45 + pulse.get() * 0.2 }],
	}));
	const orbit = useAnimatedStyle(() => ({
		transform: [{ rotate: `${spin.get() * 360}deg` }],
	}));
	const bob = useAnimatedStyle(() => ({
		transform: [{ translateY: (pulse.get() - 0.5) * 5 }],
	}));
	const eyes = useAnimatedStyle(() => ({
		transform: [{ scaleY: blink.get() }],
	}));
	return (
		<View style={wisp.panel}>
			<View style={wisp.glowWash} />
			<View style={wisp.stage}>
				<Animated.View style={[wisp.halo, wisp.haloFar, haloFar]} />
				<Animated.View style={[wisp.halo, wisp.haloNear, haloNear]} />
				<Animated.View style={[StyleSheet.absoluteFill, orbit]}>
					<View
						style={[
							wisp.mote,
							{ top: "2%", left: "46%", backgroundColor: "#fff3c4" },
						]}
					/>
					<View
						style={[
							wisp.mote,
							wisp.moteSmall,
							{ bottom: "12%", right: "6%", backgroundColor: "#ffd1f2" },
						]}
					/>
					<View
						style={[
							wisp.mote,
							wisp.moteSmall,
							{ bottom: "16%", left: "6%", backgroundColor: "#c8f2ff" },
						]}
					/>
				</Animated.View>
				<Animated.View style={[wisp.orb, bob]}>
					<View style={wisp.shine} />
					<Animated.View style={[wisp.eyes, eyes]}>
						<View style={wisp.eye} />
						<View style={wisp.eye} />
					</Animated.View>
				</Animated.View>
			</View>
		</View>
	);
}

const wisp = StyleSheet.create({
	panel: {
		flex: 1,
		borderRadius: 28,
		backgroundColor: "#141433",
		overflow: "hidden",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#ffffff22",
	},
	glowWash: {
		position: "absolute",
		width: "140%",
		aspectRatio: 1,
		borderRadius: 9999,
		backgroundColor: "#3d2f7a",
		opacity: 0.45,
		bottom: "-70%",
	},
	stage: {
		height: "62%",
		maxWidth: "80%",
		aspectRatio: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	halo: {
		position: "absolute",
		width: "62%",
		aspectRatio: 1,
		borderRadius: 9999,
	},
	haloNear: { backgroundColor: "#ffd97a" },
	haloFar: { backgroundColor: "#ffb36b" },
	mote: {
		position: "absolute",
		width: "9%",
		aspectRatio: 1,
		borderRadius: 9999,
	},
	moteSmall: { width: "6%" },
	orb: {
		width: "62%",
		aspectRatio: 1,
		borderRadius: 9999,
		backgroundColor: "#ffe9a8",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: "#fff8dd",
	},
	shine: {
		position: "absolute",
		top: "14%",
		left: "20%",
		width: "26%",
		aspectRatio: 1.6,
		borderRadius: 9999,
		backgroundColor: "#ffffffaa",
	},
	eyes: {
		width: "100%",
		flexDirection: "row",
		justifyContent: "center",
		marginTop: "8%",
	},
	eye: {
		width: "11%",
		aspectRatio: 0.7,
		marginHorizontal: "8%",
		borderRadius: 9999,
		backgroundColor: "#2b1d4a",
		minWidth: 4,
	},
});

// ---------------------------------------------------------------- scenery (multiplane layers)

/**
 * One layer of a realm's scenery. `depth` is how much further than its screen the layer travels
 * while the screen moves: near layers (> 0) sweep past, far ones (< 0) hang back.
 */
function Layer({ name, depth, children }) {
	const animation = useScreenAnimation();
	const style = useAnimatedStyle(() => {
		const { current, next, layouts } = animation.get();
		const m = motionOf(name, current, next, layouts.screen);
		return {
			transform: [{ translateX: m.x * depth }, { translateY: m.y * depth }],
		};
	});
	return (
		<Animated.View
			pointerEvents="none"
			style={[StyleSheet.absoluteFill, style]}
		>
			{children}
		</Animated.View>
	);
}

const Blob = ({ x, y, size, color, opacity = 1 }) => (
	<View
		style={{
			position: "absolute",
			left: x,
			top: y,
			width: size,
			height: size,
			borderRadius: size / 2,
			backgroundColor: color,
			opacity,
		}}
	/>
);

/** Deterministic star field (no Math.random: the same sky every time). */
function Stars({ count, color = "#ffffff", seed = 7 }) {
	const { width, height } = useWindowDimensions();
	const stars = useMemo(() => {
		let s = seed;
		const rand = () => {
			s = (s * 9301 + 49297) % 233280;
			return s / 233280;
		};
		return Array.from({ length: count }, (_, i) => ({
			i,
			x: rand() * width,
			y: rand() * height * 0.7,
			size: 1.5 + rand() * 2.5,
			delay: rand() * 1800,
		}));
	}, [count, width, height, seed]);
	return stars.map((star) => <Star key={star.i} {...star} color={color} />);
}

function Star({ x, y, size, delay, color }) {
	const twinkle = useSharedValue(0.3);
	useEffect(() => {
		twinkle.set(
			withDelay(
				delay,
				withRepeat(
					withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
					-1,
					true,
				),
			),
		);
	}, [twinkle, delay]);
	const style = useAnimatedStyle(() => ({ opacity: twinkle.get() }));
	return (
		<Animated.View
			style={[
				{
					position: "absolute",
					left: x,
					top: y,
					width: size,
					height: size,
					borderRadius: size,
					backgroundColor: color,
				},
				style,
			]}
		/>
	);
}

function Scenery({ name }) {
	const { width: W, height: H } = useWindowDimensions();
	if (name === "Home")
		return (
			<>
				<Layer name={name} depth={-0.3}>
					<Stars count={34} />
				</Layer>
				<Layer name={name} depth={-0.15}>
					<Blob x={W * 0.72} y={H * 0.12} size={W * 0.18} color="#fff6d8" />
					<Blob x={W * 0.77} y={H * 0.11} size={W * 0.165} color="#0b1026" />
				</Layer>
				<Layer name={name} depth={0.2}>
					<Blob x={-W * 0.3} y={H * 0.82} size={W * 0.9} color="#141a3d" />
					<Blob x={W * 0.4} y={H * 0.86} size={W * 1.0} color="#10153a" />
				</Layer>
			</>
		);
	if (name === "Meadow")
		return (
			<>
				<Layer name={name} depth={-0.25}>
					<Blob x={W * 0.58} y={H * 0.1} size={W * 0.34} color="#fff1b8" />
					<Blob
						x={W * 0.52}
						y={H * 0.075}
						size={W * 0.46}
						color="#fff1b8"
						opacity={0.25}
					/>
				</Layer>
				<Layer name={name} depth={0.1}>
					<Blob x={-W * 0.4} y={H * 0.66} size={W * 1.1} color="#9fd88a" />
					<Blob x={W * 0.35} y={H * 0.7} size={W * 1.2} color="#86c973" />
				</Layer>
				<Layer name={name} depth={0.35}>
					<Blob x={-W * 0.2} y={H * 0.8} size={W * 0.9} color="#5fae57" />
					<Blob x={W * 0.55} y={H * 0.84} size={W * 0.8} color="#4f9a4a" />
					<Blob x={W * 0.18} y={H * 0.78} size={14} color="#ffd1f2" />
					<Blob x={W * 0.72} y={H * 0.81} size={12} color="#fff3c4" />
					<Blob x={W * 0.4} y={H * 0.85} size={10} color="#ffd1f2" />
				</Layer>
			</>
		);
	if (name === "Lagoon")
		return (
			<>
				<Layer name={name} depth={-0.25}>
					<Blob
						x={W * 0.1}
						y={H * 0.44}
						size={W * 0.16}
						color="#c8f2ff"
						opacity={0.6}
					/>
				</Layer>
				<Layer name={name} depth={0.12}>
					<Blob x={-W * 0.5} y={H * 0.6} size={W * 1.4} color="#11607a" />
					<Blob x={W * 0.3} y={H * 0.64} size={W * 1.3} color="#0e5068" />
				</Layer>
				<Layer name={name} depth={0.4}>
					<Blob
						x={W * 0.12}
						y={H * 0.74}
						size={22}
						color="#9be7ff"
						opacity={0.7}
					/>
					<Blob
						x={W * 0.2}
						y={H * 0.69}
						size={12}
						color="#9be7ff"
						opacity={0.6}
					/>
					<Blob
						x={W * 0.76}
						y={H * 0.79}
						size={28}
						color="#9be7ff"
						opacity={0.5}
					/>
					<Blob
						x={W * 0.66}
						y={H * 0.72}
						size={10}
						color="#9be7ff"
						opacity={0.7}
					/>
					<Blob x={-W * 0.2} y={H * 0.86} size={W * 0.8} color="#0a3a4c" />
					<Blob x={W * 0.5} y={H * 0.88} size={W * 0.9} color="#082f3e" />
				</Layer>
			</>
		);
	if (name === "Ember")
		return (
			<>
				<Layer name={name} depth={-0.3}>
					<Blob x={W * 0.2} y={H * 0.38} size={W * 0.6} color="#ff9a5c" />
					<Blob
						x={W * 0.1}
						y={H * 0.33}
						size={W * 0.8}
						color="#ff9a5c"
						opacity={0.18}
					/>
				</Layer>
				<Layer name={name} depth={0.12}>
					<View
						style={{
							position: "absolute",
							left: -W * 0.1,
							top: H * 0.62,
							width: W * 0.6,
							height: H * 0.3,
							borderRadius: 40,
							backgroundColor: "#7a2a35",
						}}
					/>
					<View
						style={{
							position: "absolute",
							left: W * 0.55,
							top: H * 0.58,
							width: W * 0.55,
							height: H * 0.35,
							borderRadius: 40,
							backgroundColor: "#6a2230",
						}}
					/>
				</Layer>
				<Layer name={name} depth={0.38}>
					<View
						style={{
							position: "absolute",
							left: -W * 0.1,
							top: H * 0.8,
							width: W * 1.2,
							height: H * 0.3,
							borderRadius: 60,
							backgroundColor: "#3b1020",
						}}
					/>
					<Blob x={W * 0.3} y={H * 0.74} size={8} color="#ffcf7a" />
					<Blob x={W * 0.62} y={H * 0.7} size={6} color="#ffcf7a" />
				</Layer>
			</>
		);
	return (
		<>
			<Layer name={name} depth={-0.3}>
				<Stars count={22} color="#e8fff5" seed={21} />
				<View
					style={{
						position: "absolute",
						left: -W * 0.2,
						top: H * 0.12,
						width: W * 1.4,
						height: H * 0.08,
						borderRadius: 60,
						backgroundColor: "#4dffb4",
						opacity: 0.16,
						transform: [{ rotate: "-12deg" }],
					}}
				/>
				<View
					style={{
						position: "absolute",
						left: -W * 0.2,
						top: H * 0.2,
						width: W * 1.4,
						height: H * 0.06,
						borderRadius: 60,
						backgroundColor: "#b98bff",
						opacity: 0.16,
						transform: [{ rotate: "-8deg" }],
					}}
				/>
			</Layer>
			<Layer name={name} depth={0.14}>
				<View
					style={{
						position: "absolute",
						left: W * 0.05,
						top: H * 0.66,
						width: W * 0.6,
						height: W * 0.6,
						backgroundColor: "#22385c",
						transform: [{ rotate: "45deg" }],
					}}
				/>
				<View
					style={{
						position: "absolute",
						left: W * 0.5,
						top: H * 0.7,
						width: W * 0.55,
						height: W * 0.55,
						backgroundColor: "#1b2e4d",
						transform: [{ rotate: "45deg" }],
					}}
				/>
			</Layer>
			<Layer name={name} depth={0.4}>
				<View
					style={{
						position: "absolute",
						left: -W * 0.1,
						top: H * 0.86,
						width: W * 1.2,
						height: H * 0.2,
						borderRadius: 50,
						backgroundColor: "#e9f2ff",
					}}
				/>
			</Layer>
		</>
	);
}

// ---------------------------------------------------------------- realms

/** Realms whose line reads above Wisp (Ember's would sit on the sun below the banner). */
const TEXT_FIRST = { Lagoon: true, Ember: true };

const THEME = {
	Home: {
		bg: "#0b1026",
		ink: "#f4ecff",
		accent: "#ffd97a",
		title: "Lanternlight",
		backPill: "#ffffff1f",
		line: "Wisp is ready for an adventure. Tap to follow.",
	},
	Meadow: {
		bg: "#ffd7a8",
		ink: "#3b2410",
		accent: "#e8743b",
		title: "Dawn Meadow",
		backPill: "#fff3e0dd",
		line: "Where the morning hums and the hills roll over in their sleep.",
	},
	Lagoon: {
		bg: "#0f2f45",
		ink: "#e3f8ff",
		accent: "#4fd1ff",
		title: "Moon Lagoon",
		backPill: "#ffffff24",
		line: "Wisp shrinks to a firefly to slip between the bubbles.",
	},
	Ember: {
		bg: "#4a1626",
		ink: "#ffe9de",
		accent: "#ff8a4c",
		title: "Ember Canyon",
		backPill: "#ffffff24",
		line: "Stretched out like the sunset, warm all the way across.",
	},
	Summit: {
		bg: "#0a1a2f",
		ink: "#e9fff6",
		accent: "#5effc1",
		title: "Aurora Summit",
		backPill: "#14304f",
		line: "The top of the world, where Wisp shines its brightest.",
	},
};

/** Where Wisp sits on each realm: a different size and place on every screen. */
const useSlot = (name) => {
	const { width: W } = useWindowDimensions();
	if (name === "Home")
		return {
			width: W * 0.48,
			height: W * 0.6,
			alignSelf: "center",
			marginTop: 28,
		};
	if (name === "Meadow")
		return { width: W - 40, height: W * 0.62, marginTop: 8 };
	if (name === "Lagoon")
		return {
			width: W * 0.3,
			height: W * 0.3,
			alignSelf: "flex-end",
			marginTop: 4,
		};
	if (name === "Ember")
		return { width: W - 40, height: W * 0.34, marginTop: 60 };
	return {
		width: W * 0.74,
		height: W * 0.74,
		alignSelf: "center",
		marginTop: 12,
	};
};

function Pill({ label, onPress, testID, color, ink }) {
	return (
		<Pressable
			testID={testID}
			accessibilityLabel={testID}
			onPress={onPress}
			style={({ pressed }) => [
				ui.pill,
				{ backgroundColor: color, transform: [{ scale: pressed ? 0.96 : 1 }] },
			]}
		>
			<Text style={[ui.pillText, { color: ink }]}>{label}</Text>
		</Pressable>
	);
}

function Realm({ navigation, route }) {
	const name = route.name;
	const theme = THEME[name];
	const slot = useSlot(name);
	const index = ORDER.indexOf(name);
	const next = ORDER[index + 1];
	return (
		<View style={[ui.screen, { backgroundColor: theme.bg }]}>
			<Scenery name={name} />
			<View style={ui.body}>
				<Text style={[ui.chapter, { color: theme.accent }]}>
					{name === "Home" ? "A tiny light" : `Realm ${index} of 4`}
				</Text>
				<Text style={[ui.title, { color: theme.ink }]}>{theme.title}</Text>
				{TEXT_FIRST[name] ? (
					<Text style={[ui.line, { color: theme.ink }]}>{theme.line}</Text>
				) : null}
				<Transition.Boundary
					id="wisp"
					handoff
					testID={name === "Home" ? "rl-wisp" : undefined}
					accessibilityLabel={name === "Home" ? "rl-wisp" : undefined}
					onPress={
						name === "Home" ? () => navigation.push("Meadow") : undefined
					}
					style={slot}
				>
					{name === "Home" ? <Wisp /> : null}
				</Transition.Boundary>
				{TEXT_FIRST[name] ? null : (
					<Text style={[ui.line, { color: theme.ink }]}>{theme.line}</Text>
				)}
				<View style={ui.spacer} />
				<View style={ui.row}>
					{name !== "Home" ? (
						<Pill
							label="Back"
							testID="rl-back"
							color={theme.backPill}
							ink={theme.ink}
							onPress={() => navigation.goBack()}
						/>
					) : null}
					{next && name !== "Home" ? (
						<Pill
							label={`On to ${THEME[next].title.split(" ")[1] ?? next} →`}
							testID="rl-next"
							color={theme.accent}
							ink="#16101f"
							onPress={() => navigation.push(next)}
						/>
					) : null}
					{name === "Summit" ? (
						<Pill
							label="Fly home ✦"
							testID="rl-home"
							color={theme.accent}
							ink="#08221a"
							onPress={() => navigation.popToTop()}
						/>
					) : null}
				</View>
			</View>
		</View>
	);
}

const ui = StyleSheet.create({
	screen: { flex: 1, overflow: "hidden" },
	sky: { flex: 1, backgroundColor: "#05060f" },
	body: {
		flex: 1,
		paddingTop: 104,
		paddingHorizontal: 20,
		paddingBottom: 48,
		gap: 10,
	},
	chapter: {
		fontSize: 13,
		fontWeight: "800",
		letterSpacing: 2,
		textTransform: "uppercase",
	},
	title: { fontSize: 38, fontWeight: "900", letterSpacing: -0.5 },
	line: {
		fontSize: 17,
		lineHeight: 24,
		fontWeight: "600",
		opacity: 0.85,
		maxWidth: 340,
	},
	spacer: { flex: 1 },
	row: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
	pill: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 999 },
	pillText: { fontSize: 16, fontWeight: "800" },
});

function Component() {
	return (
		// Night sky where a shrinking, drifting screen no longer covers.
		<View style={ui.sky}>
			<LabContainer>
				<Stack.Navigator>
					{ORDER.map((name) => (
						<Stack.Screen
							key={name}
							name={name}
							component={Realm}
							options={() => realmOptions(name)}
						/>
					))}
				</Stack.Navigator>
			</LabContainer>
		</View>
	);
}

export const lab: Lab = {
	id: "realms",
	title: "realms (demo)",
	covers:
		"Demo: one live Wisp handed between five screens, each arriving on its own diagonal with scale, tilt and layered scenery",
	Component,
};
