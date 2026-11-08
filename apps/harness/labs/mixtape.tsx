// @ts-nocheck
/**
 * mixtape: a demo of shared bounds with handoff over screens that each arrive their own way, in a
 * bright pop palette.
 *
 * The now-playing card (a spinning record and a bouncing equalizer) is one live view (handoff)
 * handed from screen to screen, so the music never skips: a tile on the Shelf, a hero on the Album,
 * a big disc on Now Playing, a badge on Lyrics, a banner on Queue. Each screen arrives on a diagonal
 * from its own corner with a springy scale and a tilt; the screen below drifts away from it, dims
 * and shrinks, and each screen's shapes move in layers (nearer layers travel further). Queue's
 * "Back to shelf" pops straight to the start.
 *
 * Testids: mx-tape (shelf, opens the album), mx-next, mx-back, mx-shelf (queue, pops to the start).
 */
import { useEffect } from "react";
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
	withTiming,
} from "react-native-reanimated";
import { useScreenAnimation } from "react-native-screen-transitions";
import {
	createBlankStackNavigator,
	interpolate,
	type Lab,
	LabContainer,
	SPEC,
	Transition,
} from "./ui";

const Stack = createBlankStackNavigator();
const INK = "#111111";
const CREAM = "#FFF6E0";

/** Where each screen comes from (fractions of the screen) and the tilt it arrives with. */
const ARRIVE = {
	Shelf: { x: 0, y: 0, r: 0 },
	Album: { x: 1.05, y: 0.34, r: -8 },
	Playing: { x: -1.05, y: -0.34, r: 8 },
	Lyrics: { x: -1.05, y: 0.34, r: 8 },
	Queue: { x: 1.05, y: -0.34, r: -8 },
};
const ORDER = ["Shelf", "Album", "Playing", "Lyrics", "Queue"];
/** Arrivals land with a little bounce. */
const SPRING = { stiffness: 190, damping: 20, mass: 1 };
/** Leaving uses the library's default spring: the screen and the card land together. */
const CLOSE = SPEC;
/** How far the screen below drifts away from an arriving one. */
const DRIFT = 0.2;

/** A screen's motion this frame: arriving (current) and being covered (next), as offsets. */
const motionOf = (name, current, next, screen) => {
	"worklet";
	const a = ARRIVE[name];
	const n = next ? (ARRIVE[next.route.name] ?? ARRIVE.Album) : null;
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

const screenOptions = (name) => ({
	gestureEnabled: name !== "Shelf",
	// Swipe back the way the screen came in.
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
					backgroundColor: INK,
					opacity: interpolate(m.enter, [0, 1], [0.45, 0], "clamp"),
				},
			},
			tape: { style: bounds("tape").styles({ method: "size" }) },
		};
	},
});

// ---------------------------------------------------------------- the tape (the handed-off live view)

const BARS = [
	{ color: "#FF4F8B", duration: 420 },
	{ color: "#FFD23F", duration: 560 },
	{ color: "#2F6BFF", duration: 380 },
	{ color: "#C6FF3D", duration: 640 },
	{ color: "#8B5CFF", duration: 500 },
];

function Bar({ color, duration, delay }) {
	const level = useSharedValue(0.3);
	useEffect(() => {
		level.set(
			withDelay(
				delay,
				withRepeat(
					withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
					-1,
					true,
				),
			),
		);
	}, [level, duration, delay]);
	const style = useAnimatedStyle(() => ({
		transform: [{ scaleY: 0.25 + level.get() * 0.75 }],
	}));
	return (
		<Animated.View style={[tape.bar, { backgroundColor: color }, style]} />
	);
}

function Tape() {
	const spin = useSharedValue(0);
	useEffect(() => {
		spin.set(
			withRepeat(withTiming(1, { duration: 2600, easing: Easing.linear }), -1),
		);
	}, [spin]);
	const disc = useAnimatedStyle(() => ({
		transform: [{ rotate: `${spin.get() * 360}deg` }],
	}));
	return (
		<View style={tape.panel}>
			<View style={tape.stage}>
				<Animated.View style={[tape.disc, disc]}>
					<View style={[tape.groove, { width: "86%" }]} />
					<View style={[tape.groove, { width: "70%" }]} />
					<View style={tape.label}>
						<View style={tape.labelStripe} />
						<View style={tape.hole} />
					</View>
				</Animated.View>
			</View>
			<View style={tape.eq} pointerEvents="none">
				{BARS.map((bar, i) => (
					<Bar key={bar.color} {...bar} delay={i * 90} />
				))}
			</View>
		</View>
	);
}

const tape = StyleSheet.create({
	panel: {
		flex: 1,
		borderRadius: 24,
		backgroundColor: CREAM,
		borderWidth: 3,
		borderColor: INK,
		overflow: "hidden",
		alignItems: "center",
		justifyContent: "center",
	},
	stage: {
		height: "72%",
		maxWidth: "72%",
		aspectRatio: 1,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: "6%",
	},
	disc: {
		width: "100%",
		aspectRatio: 1,
		borderRadius: 9999,
		backgroundColor: INK,
		alignItems: "center",
		justifyContent: "center",
	},
	groove: {
		position: "absolute",
		aspectRatio: 1,
		borderRadius: 9999,
		borderWidth: 1,
		borderColor: "#ffffff22",
	},
	label: {
		width: "40%",
		aspectRatio: 1,
		borderRadius: 9999,
		backgroundColor: "#FF4F8B",
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	labelStripe: {
		position: "absolute",
		width: "100%",
		height: "30%",
		backgroundColor: "#FFD23F",
	},
	hole: {
		width: "18%",
		aspectRatio: 1,
		borderRadius: 9999,
		backgroundColor: CREAM,
	},
	eq: {
		position: "absolute",
		bottom: "7%",
		height: "14%",
		width: "46%",
		flexDirection: "row",
		alignItems: "flex-end",
		justifyContent: "space-between",
	},
	bar: {
		width: "14%",
		height: "100%",
		borderRadius: 4,
		transformOrigin: "bottom",
	},
});

// ---------------------------------------------------------------- scenery (layers)

/** One layer of shapes; `depth` is how much further than its screen it travels while the screen moves. */
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

const Dot = ({ x, y, size, color, ring }) => (
	<View
		style={{
			position: "absolute",
			left: x,
			top: y,
			width: size,
			height: size,
			borderRadius: size / 2,
			backgroundColor: ring ? "transparent" : color,
			borderWidth: ring ? Math.max(3, size * 0.08) : 0,
			borderColor: color,
		}}
	/>
);

const Pill = ({ x, y, w, h, color, rotate = 0 }) => (
	<View
		style={{
			position: "absolute",
			left: x,
			top: y,
			width: w,
			height: h,
			borderRadius: h / 2,
			backgroundColor: color,
			transform: [{ rotate: `${rotate}deg` }],
		}}
	/>
);

/** A four-point sparkle. */
const Sparkle = ({ x, y, size, color }) => (
	<View
		style={{
			position: "absolute",
			left: x,
			top: y,
			width: size,
			height: size,
			alignItems: "center",
			justifyContent: "center",
		}}
	>
		<View
			style={{
				position: "absolute",
				width: size * 0.22,
				height: size,
				borderRadius: size,
				backgroundColor: color,
			}}
		/>
		<View
			style={{
				position: "absolute",
				width: size,
				height: size * 0.22,
				borderRadius: size,
				backgroundColor: color,
			}}
		/>
	</View>
);

function Scenery({ name, theme }) {
	const { width: W, height: H } = useWindowDimensions();
	const [a, b] = theme.shapes;
	const far = (
		<>
			<Dot x={W * 0.62} y={H * 0.08} size={W * 0.5} color={a} />
			<Dot x={-W * 0.25} y={H * 0.62} size={W * 0.7} color={b} ring />
		</>
	);
	const mid = (
		<>
			<Pill
				x={-W * 0.1}
				y={H * 0.86}
				w={W * 0.7}
				h={H * 0.05}
				color={b}
				rotate={-8}
			/>
			<Pill
				x={W * 0.5}
				y={H * 0.9}
				w={W * 0.7}
				h={H * 0.05}
				color={a}
				rotate={6}
			/>
		</>
	);
	const near = (
		<>
			<Sparkle x={W * 0.07} y={H * 0.77} size={W * 0.09} color={INK} />
			<Sparkle x={W * 0.86} y={H * 0.76} size={W * 0.06} color={INK} />
			<Dot x={W * 0.24} y={H * 0.8} size={W * 0.04} color={INK} />
		</>
	);
	return (
		<>
			<Layer name={name} depth={-0.25}>
				{far}
			</Layer>
			<Layer name={name} depth={0.12}>
				{mid}
			</Layer>
			<Layer name={name} depth={0.35}>
				{near}
			</Layer>
		</>
	);
}

// ---------------------------------------------------------------- screens

const THEME = {
	Shelf: {
		bg: "#FF4F8B",
		ink: INK,
		accent: "#FFD23F",
		shapes: ["#FFD23F", "#2F6BFF"],
		kicker: "Your shelf",
		title: "Mixtape",
		line: "Tap the tape that's playing.",
	},
	Album: {
		bg: "#2F6BFF",
		ink: "#FFFFFF",
		accent: "#C6FF3D",
		shapes: ["#FF8A1F", "#C6FF3D"],
		kicker: "Album",
		title: "Sunny Static",
		line: "The Lemonades · 11 songs · 38 min",
	},
	Playing: {
		bg: "#C6FF3D",
		ink: INK,
		accent: "#FF4F8B",
		shapes: ["#FF4F8B", "#2F6BFF"],
		kicker: "Now playing",
		title: "Fizz & Feedback",
		line: "2:14 / 3:41",
	},
	Lyrics: {
		bg: "#FF8A1F",
		ink: INK,
		accent: CREAM,
		shapes: [CREAM, "#8B5CFF"],
		kicker: "Lyrics",
		title: "Sing along",
		line: "",
	},
	Queue: {
		bg: "#8B5CFF",
		ink: "#FFFFFF",
		accent: "#FFD23F",
		shapes: ["#FFD23F", "#FF4F8B"],
		kicker: "Up next",
		title: "Queue",
		line: "",
	},
};

const NEXT_LABEL = { Album: "Play it", Playing: "Lyrics", Lyrics: "Queue" };
const SHELF = ["#FFD23F", "#2F6BFF", "#C6FF3D", "#8B5CFF", null, "#FF8A1F"];
const LYRICS = [
	"Turn it up, turn it round,",
	"every color makes a sound,",
	"fizz and feedback, sunny static —",
	"this whole city's automatic.",
];
const QUEUE = [
	{ title: "Paper Planets", artist: "Neon Picnic", color: "#FFD23F" },
	{ title: "Bubblegum Radar", artist: "The Lemonades", color: "#FF4F8B" },
	{ title: "Kite Weather", artist: "Low Orbit Club", color: "#C6FF3D" },
	{ title: "Cherry Signal", artist: "Mono Mango", color: "#FF8A1F" },
];

/** Where the tape sits on each screen: a different size and place every time. */
const useSlot = (name) => {
	const { width: W } = useWindowDimensions();
	const tile = (W - 40 - 24) / 3;
	if (name === "Shelf") return { width: tile, height: tile };
	if (name === "Album")
		return { width: W - 40, height: W * 0.78, marginTop: 8 };
	if (name === "Playing")
		return {
			width: W * 0.82,
			height: W * 0.82,
			alignSelf: "center",
			marginTop: 12,
		};
	if (name === "Lyrics")
		return {
			width: W * 0.26,
			height: W * 0.26,
			alignSelf: "flex-end",
			marginTop: -W * 0.2,
		};
	return { width: W - 40, height: W * 0.32, marginTop: 8 };
};

/** A chunky button with an offset shadow. */
function Chunky({ label, onPress, testID, color, ink = INK }) {
	return (
		<Pressable testID={testID} accessibilityLabel={testID} onPress={onPress}>
			{({ pressed }) => (
				<View>
					<View style={[ui.chunkyShadow]} />
					<View
						style={[
							ui.chunky,
							{
								backgroundColor: color,
								transform: [
									{ translateX: pressed ? 3 : 0 },
									{ translateY: pressed ? 3 : 0 },
								],
							},
						]}
					>
						<Text style={[ui.chunkyText, { color: ink }]}>{label}</Text>
					</View>
				</View>
			)}
		</Pressable>
	);
}

function TapeSlot({ name, navigation }) {
	const slot = useSlot(name);
	const home = name === "Shelf";
	return (
		<Transition.Boundary
			id="tape"
			handoff
			testID={home ? "mx-tape" : undefined}
			accessibilityLabel={home ? "mx-tape" : undefined}
			onPress={home ? () => navigation.push("Album") : undefined}
			style={slot}
		>
			{home ? <Tape /> : null}
		</Transition.Boundary>
	);
}

function Body({ name, navigation, theme }) {
	const { width: W } = useWindowDimensions();
	if (name === "Shelf") {
		const tile = (W - 40 - 24) / 3;
		return (
			<View style={ui.grid}>
				{SHELF.map((color) =>
					color ? (
						<View
							key={color}
							style={[
								ui.tile,
								{ width: tile, height: tile, backgroundColor: color },
							]}
						>
							<View style={ui.tileDisc} />
						</View>
					) : (
						<TapeSlot key="tape" name={name} navigation={navigation} />
					),
				)}
			</View>
		);
	}
	if (name === "Lyrics") {
		return (
			<>
				<TapeSlot name={name} navigation={navigation} />
				<View style={ui.lyrics}>
					{LYRICS.map((line, i) => (
						<Text
							key={line}
							style={[
								ui.lyric,
								{ color: theme.ink, opacity: i === 1 ? 1 : 0.55 },
							]}
						>
							{line}
						</Text>
					))}
				</View>
			</>
		);
	}
	if (name === "Queue") {
		return (
			<>
				<TapeSlot name={name} navigation={navigation} />
				<View style={ui.queue}>
					{QUEUE.map((song) => (
						<View key={song.title} style={ui.row}>
							<View style={[ui.rowArt, { backgroundColor: song.color }]} />
							<View>
								<Text style={[ui.rowTitle, { color: theme.ink }]}>
									{song.title}
								</Text>
								<Text style={[ui.rowArtist, { color: theme.ink }]}>
									{song.artist}
								</Text>
							</View>
						</View>
					))}
				</View>
			</>
		);
	}
	return (
		<>
			<TapeSlot name={name} navigation={navigation} />
			<Text style={[ui.line, { color: theme.ink }]}>{theme.line}</Text>
		</>
	);
}

function MixScreen({ navigation, route }) {
	const name = route.name;
	const theme = THEME[name];
	const next = ORDER[ORDER.indexOf(name) + 1];
	return (
		<View style={[ui.screen, { backgroundColor: theme.bg }]}>
			<Scenery name={name} theme={theme} />
			<View style={ui.body}>
				<Text style={[ui.kicker, { color: theme.ink }]}>{theme.kicker}</Text>
				<Text style={[ui.title, { color: theme.ink }]}>{theme.title}</Text>
				{name === "Shelf" ? (
					<Text style={[ui.line, { color: theme.ink }]}>{theme.line}</Text>
				) : null}
				<Body name={name} navigation={navigation} theme={theme} />
				<View style={ui.spacer} />
				<View style={ui.buttons}>
					{name !== "Shelf" ? (
						<Chunky
							label="Back"
							testID="mx-back"
							color={CREAM}
							onPress={() => navigation.goBack()}
						/>
					) : null}
					{next && name !== "Shelf" ? (
						<Chunky
							label={`${NEXT_LABEL[name]} →`}
							testID="mx-next"
							color={theme.accent}
							onPress={() => navigation.push(next)}
						/>
					) : null}
					{name === "Queue" ? (
						<Chunky
							label="Back to shelf"
							testID="mx-shelf"
							color={theme.accent}
							onPress={() => navigation.popToTop()}
						/>
					) : null}
				</View>
			</View>
		</View>
	);
}

const ui = StyleSheet.create({
	sky: { flex: 1, backgroundColor: INK },
	screen: { flex: 1, overflow: "hidden" },
	body: {
		flex: 1,
		paddingTop: 104,
		paddingHorizontal: 20,
		paddingBottom: 48,
		gap: 10,
	},
	kicker: {
		fontSize: 13,
		fontWeight: "900",
		letterSpacing: 2,
		textTransform: "uppercase",
	},
	title: { fontSize: 44, fontWeight: "900", letterSpacing: -1 },
	line: { fontSize: 17, fontWeight: "700", opacity: 0.85 },
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 14 },
	tile: {
		borderRadius: 24,
		borderWidth: 3,
		borderColor: INK,
		alignItems: "center",
		justifyContent: "center",
	},
	tileDisc: {
		width: "46%",
		aspectRatio: 1,
		borderRadius: 9999,
		backgroundColor: INK,
	},
	lyrics: { gap: 10, marginTop: 8 },
	lyric: { fontSize: 26, fontWeight: "900", lineHeight: 31 },
	queue: { gap: 12, marginTop: 6 },
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		backgroundColor: "#00000022",
		borderRadius: 18,
		padding: 10,
	},
	rowArt: {
		width: 44,
		height: 44,
		borderRadius: 12,
		borderWidth: 3,
		borderColor: INK,
	},
	rowTitle: { fontSize: 17, fontWeight: "900" },
	rowArtist: { fontSize: 13, fontWeight: "700", opacity: 0.75 },
	spacer: { flex: 1 },
	buttons: { flexDirection: "row", gap: 14, justifyContent: "flex-end" },
	chunky: {
		paddingHorizontal: 20,
		paddingVertical: 13,
		borderRadius: 999,
		borderWidth: 3,
		borderColor: INK,
	},
	chunkyShadow: {
		...StyleSheet.absoluteFillObject,
		top: 4,
		left: 4,
		right: -4,
		bottom: -4,
		borderRadius: 999,
		backgroundColor: INK,
	},
	chunkyText: { fontSize: 16, fontWeight: "900" },
});

function Component() {
	return (
		// What shows where a shrinking, drifting screen no longer covers.
		<View style={ui.sky}>
			<LabContainer>
				<Stack.Navigator>
					{ORDER.map((name) => (
						<Stack.Screen
							key={name}
							name={name}
							component={MixScreen}
							options={() => screenOptions(name)}
						/>
					))}
				</Stack.Navigator>
			</LabContainer>
		</View>
	);
}

export const lab: Lab = {
	id: "mixtape",
	title: "mixtape (demo)",
	covers:
		"Demo: one live now-playing card handed between five bright screens, each arriving on its own diagonal with scale, tilt and layered shapes",
	Component,
};
