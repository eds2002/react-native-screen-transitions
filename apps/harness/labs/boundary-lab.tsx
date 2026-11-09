// @ts-nocheck
/**
 * The engine behind the two boundary labs (shared-bounds, shared-elements). Each lab is what a user
 * writes: `Transition.Boundary` with the same id on two screens, and one line in the interpolator.
 * Everything else here is the test rig around it:
 *
 *   recipe   styles     `{ [id]: { style: bounds(id).styles({ method }) } }`
 *            zoom       `bounds(id).navigation.zoom()`              (shared bounds only)
 *            zoom-bound `bounds(id).navigation.zoom({ target: "bound" })` (shared bounds only)
 *   method   transform | size                       (styles)
 *   motion   still | slide | diagonal (tilted, a corner per level) | swirl (grows and spins in, the
 *            screen below flies past and fades) | shuffle (slides in from a random side, growing;
 *            swiped back the way it came)                            (styles; zoom moves its screens)
 *   tree     flat     List and Detail in one stack
 *            below    Detail nested `depth` stacks deep under the root (the pair crosses down)
 *            above    List nested `depth` stacks deep, Detail on the root (the pair crosses up)
 *            sibling  List and Detail each nested `depth` deep in sibling stacks
 *   depth    1 | 2 | 3
 *
 * Screens: List (level 0) is a scrolling list of cards with a horizontal carousel inside it; each card
 * opens Detail level 1, and each Detail pushes the next level (a chain). Details scroll too, and each
 * level puts its card somewhere else at another size. Shared bounds draw a copy per screen in a
 * different color (two cards on screen = a mismatch); shared elements hand one live view along (a
 * ticking counter and a spinning bar: a restart = a remount).
 *
 * Fixed bar (y ≈ 0.135, for spam): next (open card 3 / push the next level), back, scroll (the
 * focused screen), under (the screen below the focused one), back+scroll (pop, then scroll the screen
 * it lands on during the close).
 *
 * Deep link options: harness://lab/<id>?recipe=zoom&method=size&motion=diagonal&tree=below&depth=2
 * Testids: <p>-card-<id> (list), <p>-carousel-<id>, <p>-slot-<level>, <p>-next, <p>-back, <p>-config
 * (probe "kind recipe method motion tree depth"), <p>-at (probe "at:<id> level:<n>"), bar <p>-bar-*.
 */
import { StackActions } from "@react-navigation/native";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import {
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import Animated, {
	Easing,
	makeMutable,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { bridge, ScreenReporter } from "./bridge";
import {
	Button,
	colorFor,
	createBlankStackNavigator,
	interpolate,
	LabContainer,
	Probe,
	SpamBar,
	Transition,
} from "./ui";

export type BoundaryLabKind = "bounds" | "elements";

const RECIPES = {
	bounds: ["styles", "zoom", "zoom-bound"],
	elements: ["styles"],
};
const METHODS = ["transform", "size"];
const MOTIONS = ["still", "slide", "diagonal", "swirl", "shuffle"];
const TREES = ["flat", "below", "above", "sibling"];
const DEPTHS = [1, 2, 3];
/** The tracked element's color: nothing else in the lab is near it. */
const MARKER = "#00ff66";
/** Whether it is the tracked element: card 3's (not the cards further along its chain, which share a screen with it). */
const isMarked = (config, id: string) =>
	config.get().marker === 1 && id === "3";

const CARDS = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
const CAROUSEL = Array.from({ length: 6 }, (_, i) => `c${i + 1}`);

// ---------------------------------------------------------------- config

/**
 * One config per lab. Interpolators read the animated part through mutables (worklets can't read
 * React state); screens subscribe to the store; a tree or depth change remounts the navigator.
 */
function createConfig(kind: BoundaryLabKind, prefix: string) {
	const initial = {
		recipe: "styles",
		method: "transform",
		motion: "slide",
		tree: "flat",
		depth: 1,
		// marker=1: card 3's element is MARKER on every screen, for the tracker (e2e/visual/marker.py).
		marker: 0,
		// demo=1: no harness chrome (the bar, the option chips, the probes), for recording.
		demo: 0,
	};
	let cfg = initial;
	const listeners = new Set<() => void>();
	const recipe = makeMutable(cfg.recipe);
	const method = makeMutable(cfg.method);
	const motion = makeMutable(cfg.motion);
	return {
		kind,
		prefix,
		recipe,
		method,
		motion,
		get: () => cfg,
		set(patch) {
			cfg = { ...cfg, ...patch };
			recipe.set(cfg.recipe);
			method.set(cfg.method);
			motion.set(cfg.motion);
			for (const listener of listeners) listener();
		},
		/** The options of the link that opened the lab (read as it mounts: labs load before any link). */
		fromLink() {
			const url: string = globalThis.__harnessLastUrl ?? "";
			const lab = prefix === "sb" ? "shared-bounds" : "shared-elements";
			if (!url.includes(`lab/${lab}`)) return;
			const patch = {};
			for (const key of Object.keys(initial)) {
				const value = url.match(new RegExp(`[?&]${key}=([\\w-]+)`))?.[1];
				if (value)
					patch[key] =
						key === "depth" || key === "marker" || key === "demo"
							? Number(value)
							: value;
			}
			if (patch.recipe && !RECIPES[kind].includes(patch.recipe))
				delete patch.recipe;
			this.set(patch);
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	};
}

type Config = ReturnType<typeof createConfig>;

const useConfig = (config: Config) =>
	useSyncExternalStore(config.subscribe, config.get);

/** The id of a chain's card at a level: the list's card is `k`, each level's outgoing card `k-n`. */
const chainId = (k: string, level: number) => {
	"worklet";
	return level === 0 ? k : `${k}-${level}`;
};

/** A route's lab params (`{ k, level }`), however deep in nested navigation params. */
const labParams = (route) => {
	"worklet";
	let params = route?.params;
	for (let i = 0; i < 8 && params; i++) {
		if (params.k !== undefined) return params;
		params = params.params;
	}
	return null;
};

// ---------------------------------------------------------------- motion

/** Where each level comes from on the diagonal (fractions of the screen) and the tilt it arrives with. */
const CORNERS = [
	{ x: 1.05, y: -0.34, r: -8 },
	{ x: 1.05, y: 0.34, r: -8 },
	{ x: -1.05, y: -0.34, r: 8 },
	{ x: -1.05, y: 0.34, r: 8 },
];

const cornerOf = (route) => {
	"worklet";
	const level = labParams(route)?.level ?? 0;
	return CORNERS[level % 4];
};

/**
 * shuffle: the side each screen comes in from (x/y: which edge, as a fraction of the screen), and
 * the swipe that sends it back there.
 */
const SIDES = [
	{ x: 1, y: 0, gesture: "horizontal" }, // from the right
	{ x: -1, y: 0, gesture: "horizontal-inverted" }, // from the left
	{ x: 0, y: 1, gesture: "vertical" }, // from the bottom
	{ x: 0, y: -1, gesture: "vertical-inverted" }, // from the top
] as const;

/** A side picked at random per screen: from its route key, so it leaves the way it came. */
const sideOf = (route) => {
	"worklet";
	const key: string = route?.key ?? "";
	let hash = 0;
	for (let i = 0; i < key.length; i++) {
		hash = (hash * 31 + key.charCodeAt(i)) | 0;
	}
	return SIDES[Math.abs(hash) % SIDES.length];
};

const motionStyle = (
	motion,
	{ progress, current, next, layouts: { screen } },
) => {
	"worklet";
	if (motion === "slide") {
		return {
			transform: [
				{
					translateX: interpolate(
						progress,
						[0, 1, 2],
						[screen.width, 0, -screen.width * 0.3],
					),
				},
			],
		};
	}
	if (motion === "swirl") {
		// The arriving screen grows out of the center from nothing, spinning into place (and shrinks away to nothing); the
		// screen it covers scales up past the camera and fades (flying through it).
		const enter = 1 - current.progress;
		const cover = next ? next.progress : 0;
		if (cover > 0) {
			return {
				opacity: interpolate(cover, [0, 0.8], [1, 0], "clamp"),
				transform: [{ scale: interpolate(cover, [0, 1], [1, 1.35]) }],
			};
		}
		return {
			transform: [
				{ rotate: `${enter * -32}deg` },
				{ scale: interpolate(enter, [0, 1], [1, 0], "clamp") },
			],
		};
	}
	if (motion === "shuffle") {
		// Slides in from its side, growing into place; the screen it covers shrinks back and gives
		// way, away from the side the new one comes from.
		const side = sideOf(current.route);
		const covering = next ? sideOf(next.route) : null;
		const enter = 1 - current.progress;
		const cover = next ? next.progress : 0;
		const x =
			enter * side.x * screen.width -
			(covering ? covering.x * cover * screen.width * 0.25 : 0);
		const y =
			enter * side.y * screen.height -
			(covering ? covering.y * cover * screen.height * 0.25 : 0);
		const scale =
			interpolate(enter, [0, 1], [1, 0.8], "clamp") *
			interpolate(cover, [0, 1], [1, 0.88], "clamp");
		return {
			transform: [{ translateX: x }, { translateY: y }, { scale }],
		};
	}
	if (motion !== "diagonal") return null;
	const arrive = cornerOf(current.route);
	const covering = next ? cornerOf(next.route) : null;
	const enter = 1 - current.progress;
	const cover = next ? next.progress : 0;
	const x =
		enter * arrive.x * screen.width -
		(covering ? covering.x * cover * screen.width * 0.2 : 0);
	const y =
		enter * arrive.y * screen.height -
		(covering ? covering.y * cover * screen.height * 0.2 : 0);
	const r = enter * arrive.r - (covering ? covering.r * cover * 0.5 : 0);
	const scale =
		interpolate(enter, [0, 1], [1, 0.5]) *
		interpolate(cover, [0, 1], [1, 0.84]);
	return {
		transform: [
			{ translateX: x },
			{ translateY: y },
			{ rotate: `${r}deg` },
			{ scale },
		],
	};
};

/** The options every Detail (and every screen that hosts one) gets: one interpolator, as a user writes it. */
const detailOptions =
	(config: Config) =>
	({ route }) => {
		const { recipe, motion } = config.get();
		const zoom = recipe !== "styles";
		const left = (labParams(route)?.level ?? 1) % 4 >= 2;
		return {
			gestureEnabled: true,
			gestureDirection: zoom
				? ["bidirectional", "pinch-in"]
				: motion === "swirl"
					? ["vertical", "pinch-in"]
					: motion === "shuffle"
						? sideOf(route).gesture
						: motion === "diagonal" && left
							? "horizontal-inverted"
							: "horizontal",
			transitionSpec: zoom
				? Transition.Specs.Zoom
				: motion === "swirl"
					? {
							// Lands with a little overshoot; leaves on the default spring.
							open: { stiffness: 170, damping: 18, mass: 1 },
							close: Transition.Specs.DefaultSpec,
						}
					: {
							open: Transition.Specs.DefaultSpec,
							close: Transition.Specs.DefaultSpec,
						},
			screenStyleInterpolator: (props) => {
				"worklet";
				const params =
					labParams(props.active?.route) ?? labParams(props.current?.route);
				if (!params) return {};
				const r = config.recipe.get();
				if (r === "zoom" || r === "zoom-bound") {
					return props
						.bounds(chainId(params.k, params.level - 1))
						.navigation.zoom(
							r === "zoom-bound" ? { target: "bound" } : undefined,
						);
				}
				const id = params.k;
				const slot = {
					style: props
						.bounds(id)
						.styles(
							config.method.get() === "size" ? { method: "size" } : undefined,
						),
				};
				const content = motionStyle(config.motion.get(), props);
				return content
					? { content: { style: content }, [id]: slot }
					: { [id]: slot };
			},
		};
	};

// ---------------------------------------------------------------- the live view (shared elements)

function Live({ id, marked = false }) {
	const [count, setCount] = useState(0);
	const spin = useSharedValue(0);
	useEffect(() => {
		const timer = setInterval(() => setCount((c) => c + 1), 100);
		spin.set(
			withRepeat(withTiming(1, { duration: 1400, easing: Easing.linear }), -1),
		);
		return () => clearInterval(timer);
	}, [spin]);
	const bar = useAnimatedStyle(() => ({
		transform: [{ rotate: `${spin.get() * 360}deg` }],
	}));
	return (
		<View
			style={[
				styles.live,
				{ backgroundColor: marked ? MARKER : colorFor(`live${id}`) },
			]}
		>
			<Animated.View style={[styles.liveBar, bar]} />
			<Text style={styles.liveCount}>{count}</Text>
			<Text style={styles.liveLabel}>live {id}</Text>
		</View>
	);
}

// ---------------------------------------------------------------- per-level registries (the bar)

/** What each level's screen does for the bar, and its scroller (the screen under can be scrolled). */
const createRig = () => ({ next: {}, scroll: {} });

/**
 * The level of the screen in front, from the navigation state, passing over closing screens: a
 * dismissed screen stays in the state until its close ends (and a focus effect lags further), so
 * the bar's next would push from the screen that just left.
 */
const focusedLevel = (ref): number => {
	if (!ref.isReady()) return 0;
	let state = ref.getRootState();
	let route: { name: string; params?: { level?: number }; state? } | undefined;
	while (state?.routes?.length) {
		let index = state.index ?? state.routes.length - 1;
		while (index > 0 && bridge.isClosing(state.routes[index].key)) index--;
		route = state.routes[index];
		state = route?.state;
	}
	return route?.name === "Detail" ? (route.params?.level ?? 0) : 0;
};

function useRig(rig, level: number, next: () => void, scroll: () => void) {
	const nextRef = useRef(next);
	nextRef.current = next;
	useEffect(() => {
		const go = () => nextRef.current();
		rig.next[level] = go;
		rig.scroll[level] = scroll;
		return () => {
			if (rig.next[level] === go) delete rig.next[level];
			if (rig.scroll[level] === scroll) delete rig.scroll[level];
		};
	}, [rig, level, scroll]);
}

/** A scroller for a Transition.ScrollView: down by a step, back to the top once far enough. */
function useScroller() {
	const ref = useRef(null);
	const offset = useRef(0);
	const scroll = useCallback(() => {
		const y = offset.current > 260 ? 0 : offset.current + 140;
		ref.current?.scrollTo({ y, animated: true });
	}, []);
	const onScroll = useCallback((e) => {
		offset.current = e.nativeEvent.contentOffset.y;
	}, []);
	return { ref, scroll, onScroll };
}

// ---------------------------------------------------------------- screens

function Card({ config, id, testID, onPress, width, height }) {
	if (config.kind === "elements") {
		return (
			<Transition.Boundary
				id={id}
				handoff
				testID={testID}
				accessibilityLabel={testID}
				onPress={onPress}
				style={{ width, height }}
			>
				<Live id={id} marked={isMarked(config, id)} />
			</Transition.Boundary>
		);
	}
	return (
		<Transition.Boundary
			id={id}
			testID={testID}
			accessibilityLabel={testID}
			onPress={onPress}
			style={[
				styles.card,
				{
					width,
					height,
					backgroundColor: isMarked(config, id)
						? MARKER
						: colorFor(`card${id}`),
				},
			]}
		>
			<Text style={styles.cardLabel}>{id}</Text>
		</Transition.Boundary>
	);
}

function Choice({ label, options, value, onChange, testID }) {
	return (
		<View style={styles.choice}>
			<Text style={styles.choiceLabel}>{label}</Text>
			{options.map((option) => (
				<Button
					key={option}
					label={
						String(option) === String(value) ? `• ${option}` : String(option)
					}
					testID={`${testID}-${option}`}
					onPress={() => onChange(option)}
				/>
			))}
		</View>
	);
}

function makeList(config: Config, rig) {
	const p = config.prefix;
	return function List({ navigation, route }) {
		const cfg = useConfig(config);
		const { width } = useWindowDimensions();
		const size = (width - 40 - 20) / 3;
		const scroller = useScroller();
		const open = useCallback(
			(k: string) => {
				const params = { k, level: 1 };
				const { tree, depth } = config.get();
				if (tree === "below")
					navigation.dispatch(
						StackActions.push("N1", nestParams("N", depth, params)),
					);
				else if (tree === "sibling")
					navigation.dispatch(
						StackActions.push("B1", nestParams("B", depth, params)),
					);
				else navigation.dispatch(StackActions.push("Detail", params));
			},
			[navigation],
		);
		useRig(rig, 0, () => open("3"), scroller.scroll);
		return (
			<View style={styles.screen}>
				<ScreenReporter routeKey={route.key} name={route.name} />
				<Transition.ScrollView
					ref={scroller.ref}
					onScroll={scroller.onScroll}
					scrollEventThrottle={16}
					contentContainerStyle={styles.listContent}
				>
					<Text style={styles.title}>
						{config.kind === "bounds" ? "Shared bounds" : "Shared elements"}
					</Text>
					{cfg.demo ? null : (
						<>
							<Probe
								testID={`${p}-config`}
								value={`${config.kind} ${cfg.recipe} ${cfg.method} ${cfg.motion} ${cfg.tree} ${cfg.depth}`}
							/>
							{RECIPES[config.kind].length > 1 ? (
								<Choice
									label="recipe"
									options={RECIPES[config.kind]}
									value={cfg.recipe}
									testID={`${p}-recipe`}
									onChange={(recipe) => config.set({ recipe })}
								/>
							) : null}
							<Choice
								label="method"
								options={METHODS}
								value={cfg.method}
								testID={`${p}-method`}
								onChange={(method) => config.set({ method })}
							/>
							<Choice
								label="motion"
								options={MOTIONS}
								value={cfg.motion}
								testID={`${p}-motion`}
								onChange={(motion) => config.set({ motion })}
							/>
							<Choice
								label="tree"
								options={TREES}
								value={cfg.tree}
								testID={`${p}-tree`}
								onChange={(tree) => config.set({ tree })}
							/>
							<Choice
								label="depth"
								options={DEPTHS}
								value={cfg.depth}
								testID={`${p}-depth`}
								onChange={(depth) => config.set({ depth })}
							/>
						</>
					)}
					<Transition.ScrollView
						horizontal
						style={styles.carousel}
						contentContainerStyle={styles.carouselContent}
					>
						{CAROUSEL.map((id) => (
							<Card
								key={id}
								config={config}
								id={id}
								testID={`${p}-carousel-${id}`}
								onPress={() => open(id)}
								width={size * 1.3}
								height={size}
							/>
						))}
					</Transition.ScrollView>
					<View style={styles.grid}>
						{CARDS.map((id) => (
							<Card
								key={id}
								config={config}
								id={id}
								testID={`${p}-card-${id}`}
								onPress={() => open(id)}
								width={size}
								height={size * 1.25}
							/>
						))}
					</View>
				</Transition.ScrollView>
			</View>
		);
	};
}

/** Where each level puts its card: another place, another size. */
const slotStyle = (level: number, width: number) => {
	const w = width - 40;
	const shapes = [
		{ width: w, height: w * 0.62 },
		{ width: w * 0.32, height: w * 0.32, alignSelf: "flex-end" },
		{ width: w, height: w * 0.3 },
		{ width: w * 0.7, height: w * 0.7, alignSelf: "center" },
	];
	return shapes[(level - 1) % shapes.length];
};

function makeDetail(config: Config, rig) {
	const p = config.prefix;
	return function Detail({ navigation, route }) {
		const cfg = useConfig(config);
		const { width } = useWindowDimensions();
		const { k, level } = route.params;
		const scroller = useScroller();
		const next = useCallback(
			() => navigation.push("Detail", { k, level: level + 1 }),
			[navigation, k, level],
		);
		useRig(rig, level, next, scroller.scroll);
		const zoom = cfg.recipe !== "styles";
		const slot = slotStyle(level, width);
		let incoming = null;
		if (config.kind === "elements") {
			incoming = (
				<Transition.Boundary
					id={k}
					handoff
					testID={`${p}-slot-${level}`}
					style={slot}
				/>
			);
		} else if (!zoom || cfg.recipe === "zoom-bound") {
			const id = zoom ? chainId(k, level - 1) : k;
			incoming = (
				<Transition.Boundary
					id={id}
					testID={`${p}-slot-${level}`}
					style={[
						styles.card,
						slot,
						{
							backgroundColor: isMarked(config, id)
								? MARKER
								: colorFor(`slot${level}`),
						},
					]}
				>
					<Text style={styles.cardLabel}>{id}</Text>
				</Transition.Boundary>
			);
		}
		return (
			<View
				style={[styles.screen, { backgroundColor: colorFor(`level${level}`) }]}
			>
				<ScreenReporter routeKey={route.key} name={route.name} />
				<Transition.ScrollView
					ref={scroller.ref}
					onScroll={scroller.onScroll}
					scrollEventThrottle={16}
					contentContainerStyle={styles.detailContent}
				>
					<Text style={styles.title}>Level {level}</Text>
					{cfg.demo ? null : (
						<Probe testID={`${p}-at`} value={`at:${k} level:${level}`} />
					)}
					{incoming}
					<View style={styles.row}>
						<Button
							label="Back"
							testID={`${p}-back`}
							onPress={() => navigation.goBack()}
						/>
						{zoom ? null : (
							<Button label="Next" testID={`${p}-next`} onPress={next} />
						)}
					</View>
					{zoom ? (
						<Card
							config={config}
							id={chainId(k, level)}
							testID={`${p}-next`}
							onPress={next}
							width={width * 0.4}
							height={width * 0.3}
						/>
					) : null}
					{[0, 1, 2, 3].map((i) => (
						<View key={i} style={styles.filler} />
					))}
				</Transition.ScrollView>
			</View>
		);
	};
}

// ---------------------------------------------------------------- route trees

/** Params that open `params` on the leaf of a `depth`-deep nest named `<prefix>1..<prefix>depth`. */
const nestParams = (prefix: string, depth: number, params, leaf = "Detail") => {
	let inner = { screen: leaf, params };
	for (let i = depth; i >= 2; i--)
		inner = { screen: `${prefix}${i}`, params: inner };
	return inner;
};

const NAVS = {};
const navFor = (key: string) => {
	NAVS[key] ??= createBlankStackNavigator();
	return NAVS[key];
};

function makeLab(config: Config) {
	const rig = createRig();
	const List = makeList(config, rig);
	const Detail = makeDetail(config, rig);
	const options = detailOptions(config);
	const nests = {};

	/** The component for nest level `i` of `prefix`: its stack holds the next level, or the leaves. */
	const nestFor = (prefix: string, i: number, depth: number, leaves) => {
		const key = `${prefix}${i}/${depth}`;
		if (nests[key]) return nests[key];
		const Nav = navFor(`${config.prefix}${key}`);
		nests[key] = function Nest({ route }) {
			return (
				<>
					{/* Its screen opens and closes the stack: the bar reads whether it is closing. */}
					<ScreenReporter routeKey={route.key} name={route.name} />
					<Nav.Navigator>
						{i < depth ? (
							<Nav.Screen
								name={`${prefix}${i + 1}`}
								component={nestFor(prefix, i + 1, depth, leaves)}
							/>
						) : (
							leaves(Nav)
						)}
					</Nav.Navigator>
				</>
			);
		};
		return nests[key];
	};

	const listLeaf = (Nav) => <Nav.Screen name="List" component={List} />;
	const detailLeaf = (Nav) => (
		<Nav.Screen name="Detail" component={Detail} options={options} />
	);

	function Tree({ tree, depth }) {
		const Root = navFor(`${config.prefix}root/${tree}/${depth}`);
		if (tree === "below") {
			return (
				<Root.Navigator>
					<Root.Screen name="List" component={List} />
					<Root.Screen
						name="N1"
						component={nestFor("N", 1, depth, detailLeaf)}
						options={options}
					/>
				</Root.Navigator>
			);
		}
		if (tree === "above") {
			return (
				<Root.Navigator>
					<Root.Screen name="L1" component={nestFor("L", 1, depth, listLeaf)} />
					<Root.Screen name="Detail" component={Detail} options={options} />
				</Root.Navigator>
			);
		}
		if (tree === "sibling") {
			return (
				<Root.Navigator>
					<Root.Screen name="A1" component={nestFor("A", 1, depth, listLeaf)} />
					<Root.Screen
						name="B1"
						component={nestFor("B", 1, depth, detailLeaf)}
						options={options}
					/>
				</Root.Navigator>
			);
		}
		return (
			<Root.Navigator>
				<Root.Screen name="List" component={List} />
				<Root.Screen name="Detail" component={Detail} options={options} />
			</Root.Navigator>
		);
	}

	return function BoundaryLab() {
		useState(() => config.fromLink());
		const cfg = useConfig(config);
		const p = config.prefix;
		return (
			// Diagonal screens shrink and drift: what shows behind them is intended, not a blank.
			<View
				style={{
					flex: 1,
					backgroundColor:
						(cfg.motion === "diagonal" ||
							cfg.motion === "swirl" ||
							cfg.motion === "shuffle") &&
						cfg.recipe === "styles"
							? "#05060f"
							: undefined,
				}}
			>
				<LabContainer
					key={`${cfg.tree}/${cfg.depth}`}
					overlay={
						cfg.demo
							? undefined
							: (ref) => (
									<SpamBar
										buttons={[
											{
												id: `${p}-bar-next`,
												label: "next",
												onPress: () => rig.next[focusedLevel(ref)]?.(),
											},
											{
												id: `${p}-bar-back`,
												label: "back",
												onPress: () => ref.canGoBack() && ref.goBack(),
											},
											{
												id: `${p}-bar-scroll`,
												label: "scroll",
												onPress: () => rig.scroll[focusedLevel(ref)]?.(),
											},
											{
												id: `${p}-bar-under`,
												label: "under",
												onPress: () => rig.scroll[focusedLevel(ref) - 1]?.(),
											},
											{
												id: `${p}-bar-back-scroll`,
												label: "back+scroll",
												onPress: () => {
													const level = focusedLevel(ref);
													if (!ref.canGoBack()) return;
													ref.goBack();
													setTimeout(() => rig.scroll[level - 1]?.(), 60);
												},
											},
										]}
									/>
								)
					}
				>
					<Tree tree={cfg.tree} depth={cfg.depth} />
				</LabContainer>
			</View>
		);
	};
}

/** A boundary lab: shared bounds (copies) or shared elements (handoff). */
export const createBoundaryLab = (kind: BoundaryLabKind, prefix: string) =>
	makeLab(createConfig(kind, prefix));

// ---------------------------------------------------------------- styles

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: "#111827" },
	listContent: {
		paddingTop: 160,
		paddingHorizontal: 20,
		paddingBottom: 520,
		gap: 10,
	},
	detailContent: {
		paddingTop: 160,
		paddingHorizontal: 20,
		paddingBottom: 200,
		gap: 14,
	},
	title: { color: "white", fontSize: 30, fontWeight: "800" },
	choice: {
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		gap: 6,
	},
	choiceLabel: { color: "#fff9", width: 58, fontWeight: "700" },
	carousel: { marginHorizontal: -20 },
	carouselContent: { paddingHorizontal: 20, gap: 10 },
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	card: { borderRadius: 18, justifyContent: "flex-end", padding: 10 },
	cardLabel: { color: "white", fontSize: 22, fontWeight: "800" },
	row: { flexDirection: "row", gap: 10 },
	filler: { height: 140, borderRadius: 18, backgroundColor: "#0003" },
	live: {
		flex: 1,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	liveBar: {
		position: "absolute",
		width: "70%",
		height: 6,
		borderRadius: 3,
		backgroundColor: "#fff8",
	},
	liveCount: { color: "white", fontSize: 26, fontWeight: "900" },
	liveLabel: { color: "#fffc", fontWeight: "700" },
});
