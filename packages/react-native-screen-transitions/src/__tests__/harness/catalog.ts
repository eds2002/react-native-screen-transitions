/**
 * The generated scenario space: every transition × spec × step sequence that
 * makes sense together. A handful of building blocks cover what the e2e app's
 * examples exercise one by one.
 */
import type { Scenario, Step, SwipeDirection } from "./scenario";
import type { Rect, ScreenSpec } from "./stack-harness";

type TransitionFactory = (interpolate: InterpolateFn) => {
	options: Record<string, unknown>;
	/** The swipe that dismisses, or null when the transition has no gesture. */
	dismiss: SwipeDirection | null;
};

type InterpolateFn = (value: number, input: number[], output: number[], extrapolation?: string) => number;

type Presets = Record<string, (config?: Record<string, unknown>) => Record<string, unknown>>;

// The library's default spring (Transition.Specs.DefaultSpec), for transitions written here.
const DEFAULT_SPEC = { stiffness: 1000, damping: 500, mass: 3, overshootClamping: false, restSpeedThreshold: 0.02 };

/** A slide from one edge, with the previous screen parallaxing away (like the e2e app's IOSSlide). */
const slide =
	(direction: SwipeDirection): TransitionFactory =>
	(interpolate) => ({
		dismiss: direction,
		options: {
			gestureEnabled: true,
			gestureDirection: direction,
			transitionSpec: { open: DEFAULT_SPEC, close: DEFAULT_SPEC },
			screenStyleInterpolator: ({ progress, layouts: { screen } }: any) => {
				"worklet";
				const horizontal = direction.startsWith("horizontal");
				const size = horizontal ? screen.width : screen.height;
				const sign = direction.endsWith("inverted") ? -1 : 1;
				const offset = interpolate(progress, [0, 1, 2], [sign * size, 0, -sign * size * 0.3]);
				return {
					content: { style: { transform: [horizontal ? { translateX: offset } : { translateY: offset }] } },
					backdrop: { style: { backgroundColor: "black", opacity: interpolate(progress, [0, 1, 2], [0, 0.3, 0.3]) } },
				};
			},
		},
	});

/**
 * Interpolator math is not under test: one horizontal and one vertical slide
 * exercise progress, gestures and lifecycle in both axes.
 */
export const transitions = (_presets: Presets): Record<string, TransitionFactory> => ({
	"slide-horizontal": slide("horizontal"),
	"slide-vertical": slide("vertical"),
});

/** A spring (the library default) and no spec (instant switches). */
export const specs: Record<string, { spec?: Record<string, unknown> | null; mayOvershoot?: boolean; instant?: boolean }> = {
	"preset-spec": {},
	// No transitionSpec: the library switches screens without animating.
	instant: { spec: null, instant: true },
};

/** Step sequences, given the dismiss swipe (null: the sequence needs none). */
export const sequences: Record<string, (dismiss: SwipeDirection | null) => Step[] | null> = {
	"push-pop": () => [{ op: "push", name: "B" }, { op: "settle" }, { op: "pop" }],
	"swipe-dismiss": (d) => d && [{ op: "push", name: "B" }, { op: "settle" }, { op: "swipe", direction: d, distance: 0.75, durationMs: 200 }],
	"swipe-cancel": (d) =>
		d && [{ op: "push", name: "B" }, { op: "settle" }, { op: "swipe", direction: d, distance: 0.2, durationMs: 300, holdMs: 200 }],
	"grab-mid-push": (d) =>
		d && [{ op: "push", name: "B" }, { op: "frames", count: 8 }, { op: "swipe", direction: d, distance: 0.75, durationMs: 200 }],
	"regrab-spring-back": (d) =>
		d && [
			{ op: "push", name: "B" },
			{ op: "settle" },
			{ op: "swipe", direction: d, distance: 0.25, durationMs: 300, holdMs: 150 },
			{ op: "frames", count: 4 },
			{ op: "swipe", direction: d, distance: 0.75, durationMs: 200 },
		],
	"pop-mid-push": () => [{ op: "push", name: "B" }, { op: "frames", count: 6 }, { op: "pop" }],
	"push-mid-pop": () => [{ op: "push", name: "B" }, { op: "settle" }, { op: "pop" }, { op: "frames", count: 5 }, { op: "push", name: "B" }],
	// Push, pop while it is still opening, push again (push/pop spam ~100 ms apart).
	"push-pop-push": () => [
		{ op: "push", name: "B" },
		{ op: "frames", count: 6 },
		{ op: "pop" },
		{ op: "frames", count: 6 },
		{ op: "push", name: "B" },
		{ op: "settle" },
	],
	deep: () => [
		{ op: "push", name: "B" },
		{ op: "settle" },
		{ op: "push", name: "C" },
		{ op: "settle" },
		{ op: "pop" },
		{ op: "settle" },
		{ op: "pop" },
	],
	replace: () => [{ op: "push", name: "B" }, { op: "settle" }, { op: "replace", name: "C" }, { op: "settle" }, { op: "pop" }],
	rapid: () => [{ op: "push", name: "B" }, { op: "push", name: "C" }, { op: "frames", count: 2 }, { op: "pop" }, { op: "pop" }],
};

const TURNS_BACK_ONCE = new Set(["push-mid-pop", "push-pop-push"]);

export const buildCatalog = (presets: Presets, interpolate: InterpolateFn): Scenario[] => {
	const scenarios: Scenario[] = [];
	for (const [transitionName, factory] of Object.entries(transitions(presets))) {
		for (const [specName, { spec, mayOvershoot, instant }] of Object.entries(specs)) {
			const { options, dismiss } = factory(interpolate);
			const screenOptions =
				spec === null
					? { ...options, transitionSpec: undefined }
					: spec
						? { ...options, transitionSpec: { open: spec, close: spec } }
						: options;
			for (const [sequenceName, build] of Object.entries(sequences)) {
				const steps = build(dismiss);
				if (!steps) continue;
				// A push landing during a pop: A follows the closing screen back, then the new one covers it.
				const mayTurnBack = TURNS_BACK_ONCE.has(sequenceName) ? ["A"] : undefined;
				scenarios.push({
					name: `${transitionName} / ${specName} / ${sequenceName}`,
					screens: [{ name: "A" }, { name: "B" }, { name: "C" }],
					screenOptions,
					steps,
					expect: { mayOvershoot, instant, mayTurnBack },
				});
			}
		}
	}
	return scenarios;
};

// ---------------------------------------------------------------------------
// Sheets: snap points, snapTo, snap gestures, snap lock, step behavior.

type SheetEdge = "bottom" | "top" | "right" | "left";

const SHEET_DISMISS: Record<SheetEdge, SwipeDirection> = {
	bottom: "vertical",
	top: "vertical-inverted",
	right: "horizontal",
	left: "horizontal-inverted",
};

const OPPOSITE: Record<SwipeDirection, SwipeDirection> = {
	vertical: "vertical-inverted",
	"vertical-inverted": "vertical",
	horizontal: "horizontal-inverted",
	"horizontal-inverted": "horizontal",
};

type SheetVariant = {
	edge: SheetEdge;
	snapPoints: number[];
	initialSnapIndex: number;
	extra?: Record<string, unknown>;
	locked?: boolean;
};

export const sheetVariants: Record<string, SheetVariant> = {
	"sheet-bottom": { edge: "bottom", snapPoints: [0.5, 1], initialSnapIndex: 0 },
	"sheet-right": { edge: "right", snapPoints: [0.5, 1], initialSnapIndex: 0 },
	"sheet-three-snaps": { edge: "bottom", snapPoints: [0.3, 0.6, 1], initialSnapIndex: 1 },
	"sheet-step": { edge: "bottom", snapPoints: [0.4, 0.9, 1], initialSnapIndex: 1, extra: { sheetSnapBehavior: "step" } },
	"sheet-locked": {
		edge: "bottom",
		snapPoints: [0.3, 0.6, 1],
		initialSnapIndex: 1,
		extra: { gestureSnapLocked: true },
		locked: true,
	},
};

/** The sheet's resting rect at snap fraction `s` (the interpolator below puts it there). */
const sheetRect = (edge: SheetEdge, s: number, window: { width: number; height: number }) => {
	const off = 1 - s;
	switch (edge) {
		case "bottom":
			return { x: 0, y: off * window.height, ...window };
		case "top":
			return { x: 0, y: -off * window.height, ...window };
		case "right":
			return { x: off * window.width, y: 0, ...window };
		case "left":
			return { x: -off * window.width, y: 0, ...window };
	}
};

const sheetOptions = (variant: SheetVariant, interpolate: InterpolateFn) => ({
	gestureEnabled: true,
	gestureDirection: SHEET_DISMISS[variant.edge],
	snapPoints: variant.snapPoints,
	initialSnapIndex: variant.initialSnapIndex,
	transitionSpec: { open: DEFAULT_SPEC, close: DEFAULT_SPEC },
	...variant.extra,
	screenStyleInterpolator: ({ progress, layouts: { screen } }: any) => {
		"worklet";
		const horizontal = variant.edge === "left" || variant.edge === "right";
		const size = horizontal ? screen.width : screen.height;
		const sign = variant.edge === "top" || variant.edge === "left" ? -1 : 1;
		const offset = interpolate(progress, [0, 1], [sign * size, 0], "clamp");
		return {
			content: { style: { transform: [horizontal ? { translateX: offset } : { translateY: offset }] } },
		};
	},
});

/** Sheet step sequences, given the variant: S is the sheet over A. */
export const sheetSequences: Record<string, (v: SheetVariant) => Step[] | null> = {
	"open-close": (v) => [{ op: "push", name: "S" }, { op: "expectSnap", index: v.initialSnapIndex }, { op: "pop" }],
	"snap-to-cycle": (v) => [
		{ op: "push", name: "S" },
		{ op: "settle" },
		{ op: "snapTo", index: v.snapPoints.length - 1 },
		{ op: "expectSnap", index: v.snapPoints.length - 1 },
		{ op: "snapTo", index: 0 },
		{ op: "expectSnap", index: 0 },
		{ op: "pop" },
	],
	"swipe-expand": (v) => [
		{ op: "push", name: "S" },
		{ op: "settle" },
		{ op: "swipe", direction: OPPOSITE[SHEET_DISMISS[v.edge]], distance: 0.4, durationMs: 200 },
		...(v.locked ? [{ op: "expectSnap", index: v.initialSnapIndex } as Step] : []),
	],
	"swipe-dismiss": (v) => [
		{ op: "push", name: "S" },
		{ op: "settle" },
		...(v.initialSnapIndex === 0 ? [] : ([{ op: "snapTo", index: 0 }, { op: "settle" }] as Step[])),
		{ op: "swipe", direction: SHEET_DISMISS[v.edge], distance: 0.6, durationMs: 200 },
	],
	"collapse-from-full": (v) => [
		{ op: "push", name: "S" },
		{ op: "settle" },
		{ op: "snapTo", index: v.snapPoints.length - 1 },
		{ op: "settle" },
		{ op: "swipe", direction: SHEET_DISMISS[v.edge], distance: 0.25, durationMs: 400, holdMs: 150 },
		...(v.locked ? [{ op: "expectSnap", index: v.snapPoints.length - 1 } as Step] : []),
	],
	"snap-to-during-open": (v) => [
		{ op: "push", name: "S" },
		{ op: "frames", count: 5 },
		{ op: "snapTo", index: v.snapPoints.length - 1 },
		{ op: "expectSnap", index: v.snapPoints.length - 1 },
	],
	"snap-to-interrupt": (v) => [
		{ op: "push", name: "S" },
		{ op: "settle" },
		{ op: "snapTo", index: v.snapPoints.length - 1 },
		{ op: "frames", count: 4 },
		{ op: "snapTo", index: 0 },
		{ op: "expectSnap", index: 0 },
	],
	// A constant-speed finger (already moving when it lands) grabs the sheet mid-snap.
	"swipe-during-snap": (v) => [
		{ op: "push", name: "S" },
		{ op: "settle" },
		{ op: "snapTo", index: v.snapPoints.length - 1 },
		{ op: "frames", count: 4 },
		{ op: "swipe", direction: SHEET_DISMISS[v.edge], distance: 0.6, durationMs: 200, profile: "linear" },
	],
	// Let go short of a snap change (springs back), then grab again while it springs back.
	"regrab-spring-back": (v) =>
		v.locked
			? null
			: [
					{ op: "push", name: "S" },
					{ op: "settle" },
					{ op: "swipe", direction: SHEET_DISMISS[v.edge], distance: 0.15, durationMs: 300, holdMs: 150 },
					{ op: "frames", count: 1 },
					{ op: "swipe", direction: SHEET_DISMISS[v.edge], distance: 0.15, durationMs: 300, holdMs: 150 },
				],
	"pop-during-snap": (v) => [
		{ op: "push", name: "S" },
		{ op: "settle" },
		{ op: "snapTo", index: v.snapPoints.length - 1 },
		{ op: "frames", count: 4 },
		{ op: "pop" },
	],
};

export const buildSheetCatalog = (interpolate: InterpolateFn, window: { width: number; height: number }): Scenario[] => {
	const scenarios: Scenario[] = [];
	for (const [variantName, variant] of Object.entries(sheetVariants)) {
		for (const [specName, { spec, mayOvershoot }] of Object.entries(specs)) {
			if (spec === null) continue;
			const base = sheetOptions(variant, interpolate);
			const options = spec ? { ...base, transitionSpec: { open: spec, close: spec } } : base;
			const snapRects = [...variant.snapPoints].sort((a, b) => a - b).map((s) => sheetRect(variant.edge, s, window));
			for (const [sequenceName, build] of Object.entries(sheetSequences)) {
				const steps = build(variant);
				if (!steps) continue;
				scenarios.push({
					name: `${variantName} / ${specName} / ${sequenceName}`,
					screens: [{ name: "A" }, { name: "S", options }],
					steps,
					expect: { mayOvershoot, snapRects, rest: { S: snapRects } },
				});
			}
		}
	}
	return scenarios;
};


// ---------------------------------------------------------------------------
// Backdrops: what a tap outside a sheet does, per backdropBehavior.

type Behavior = "dismiss" | "collapse" | "block" | "passthrough";

/** A bottom sheet over A; collapse gets two snap points so it has somewhere to collapse to. */
const backdropSheet = (behavior: Behavior): SheetVariant =>
	behavior === "collapse"
		? { edge: "bottom", snapPoints: [0.5, 0.75], initialSnapIndex: 1, extra: { backdropBehavior: behavior } }
		: { edge: "bottom", snapPoints: [0.5], initialSnapIndex: 0, extra: { backdropBehavior: behavior } };

let ABOVE_SHEET = { x: 195, y: 120 };
let ON_SHEET = { x: 195, y: 780 };

export const backdropSequences: Record<string, (behavior: Behavior) => Step[]> = {
	"tap-backdrop": (behavior) => {
		const open: Step[] = [{ op: "push", name: "S" }, { op: "settle" }, { op: "tap", at: ABOVE_SHEET }];
		switch (behavior) {
			case "dismiss":
				return [...open, { op: "expectRoutes", names: ["A"] }, { op: "expectTaps", counts: { A: 0, S: 0 } }];
			case "collapse":
				return [
					...open,
					{ op: "expectSnap", index: 0 },
					{ op: "expectRoutes", names: ["A", "S"] },
					{ op: "tap", at: ABOVE_SHEET },
					{ op: "expectRoutes", names: ["A"] },
					{ op: "expectTaps", counts: { A: 0, S: 0 } },
				];
			case "block":
				return [...open, { op: "expectRoutes", names: ["A", "S"] }, { op: "expectTaps", counts: { A: 0, S: 0 } }];
			case "passthrough":
				return [...open, { op: "expectRoutes", names: ["A", "S"] }, { op: "expectTaps", counts: { A: 1, S: 0 } }];
		}
	},
	"tap-sheet": () => [
		{ op: "push", name: "S" },
		{ op: "settle" },
		{ op: "tap", at: ON_SHEET },
		{ op: "expectRoutes", names: ["A", "S"] },
		{ op: "expectTaps", counts: { A: 0, S: 1 } },
	],
	"tap-backdrop-while-opening": () => [{ op: "push", name: "S" }, { op: "frames", count: 4 }, { op: "tap", at: ABOVE_SHEET }],
	"double-tap-backdrop": () => [
		{ op: "push", name: "S" },
		{ op: "settle" },
		{ op: "tap", at: ABOVE_SHEET },
		{ op: "frames", count: 2 },
		{ op: "tap", at: ABOVE_SHEET },
	],
	"tap-backdrop-then-swipe": () => [
		{ op: "push", name: "S" },
		{ op: "settle" },
		{ op: "tap", at: ABOVE_SHEET },
		{ op: "frames", count: 3 },
		{ op: "swipe", direction: "vertical", distance: 0.3, durationMs: 250, profile: "linear" },
	],
};

export const buildBackdropCatalog = (interpolate: InterpolateFn, window: { width: number; height: number }): Scenario[] => {
	// Above the half-height sheet, and on it, for this window.
	ABOVE_SHEET = { x: window.width / 2, y: window.height * 0.14 };
	ON_SHEET = { x: window.width / 2, y: window.height * 0.92 };
	const scenarios: Scenario[] = [];
	for (const behavior of ["dismiss", "collapse", "block", "passthrough"] as Behavior[]) {
		const variant = backdropSheet(behavior);
		const options = sheetOptions(variant, interpolate);
		const snapRects = [...variant.snapPoints].sort((a, b) => a - b).map((s) => sheetRect(variant.edge, s, window));
		for (const [sequenceName, build] of Object.entries(backdropSequences)) {
			scenarios.push({
				name: `backdrop-${behavior} / preset-spec / ${sequenceName}`,
				screens: [{ name: "A" }, { name: "S", options }],
				steps: build(behavior),
				expect: { snapRects, rest: { S: snapRects } },
			});
		}
	}
	return scenarios;
};


// ---------------------------------------------------------------------------
// Nested gesture ownership: the e2e app's gestures/* setups, with the outcomes
// their GestureInfo tables document (which level a swipe dismisses, if any).

type FingerDirection = "down" | "up" | "right" | "left";

const FINGER: Record<FingerDirection, SwipeDirection> = {
	down: "vertical",
	up: "vertical-inverted",
	right: "horizontal",
	left: "horizontal-inverted",
};

type OwnershipSetup = {
	screens: ScreenSpec[];
	/** Steps that open the screen the rows swipe on. */
	reach: Step[];
	/** Path to that screen. */
	at: string[];
	/** Per finger direction: the focused path after the swipe (null: nothing happens). */
	rows: Partial<Record<FingerDirection, string[] | null>>;
	/** Extra steps checked after a row's swipe (e.g. a sheet expanding). */
	after?: Partial<Record<FingerDirection, Step[]>>;
	rest?: Record<string, Rect[] | null>;
	snapRects?: Rect[];
};

export const buildOwnershipCatalog = (interpolate: InterpolateFn, window: { width: number; height: number }): Scenario[] => {
	const slideOpts = (direction: SwipeDirection) => slide(direction)(interpolate).options;
	const sheetVariant = (edge: SheetEdge, snapPoints: number[], initialSnapIndex: number, extra?: Record<string, unknown>): SheetVariant => ({
		edge,
		snapPoints,
		initialSnapIndex,
		extra,
	});
	const sheetOpts = (v: SheetVariant) => sheetOptions(v, interpolate);
	const rects = (edge: SheetEdge, snaps: number[]) => snaps.map((s) => sheetRect(edge, s, window));
	const open = (...names: string[]): Step[] => {
		// push the first level, then push each deeper level onto its nested stack
		const steps: Step[] = [{ op: "push", name: names[0] }, { op: "settle" }];
		for (let depth = 1; depth < names.length; depth++) {
			steps.push({ op: "pushIn", path: names.slice(0, depth), name: names[depth] }, { op: "settle" });
		}
		return steps;
	};
	const leaf = (name: string, options?: Record<string, unknown>): ScreenSpec => ({ name, options });
	const L1 = (options: Record<string, unknown>, screens: ScreenSpec[]): ScreenSpec => ({ name: "L1", options, stack: { screens } });

	const setups: Record<string, OwnershipSetup> = {
		"simple-inheritance": {
			screens: [{ name: "home" }, L1(slideOpts("vertical"), [leaf("index"), leaf("leaf")])],
			reach: open("L1", "leaf"),
			at: ["L1", "leaf"],
			rows: { down: ["home"], up: null, right: null, left: null },
		},
		"two-axes": {
			screens: [{ name: "home" }, L1(slideOpts("vertical"), [leaf("index"), leaf("leaf", slideOpts("horizontal"))])],
			reach: open("L1", "leaf"),
			at: ["L1", "leaf"],
			rows: { down: ["home"], right: ["L1", "index"], up: null, left: null },
		},
		"same-axis-shadowing": {
			screens: [{ name: "home" }, L1(slideOpts("vertical"), [leaf("index"), leaf("leaf", slideOpts("vertical"))])],
			reach: open("L1", "leaf"),
			at: ["L1", "leaf"],
			rows: { down: ["L1", "index"], up: null },
		},
		"deep-nesting": {
			screens: [
				{ name: "home" },
				L1(slideOpts("vertical"), [
					leaf("index"),
					{ name: "deeper", options: slideOpts("horizontal"), stack: { screens: [leaf("index"), leaf("leaf", slideOpts("vertical"))] } },
				]),
			],
			reach: open("L1", "deeper", "leaf"),
			at: ["L1", "deeper", "leaf"],
			rows: { down: ["L1", "deeper", "index"], right: ["L1", "index"], up: null, left: null },
		},
		"inverted-gesture": {
			screens: [{ name: "home" }, L1(slideOpts("vertical-inverted"), [leaf("index"), leaf("leaf")])],
			reach: open("L1", "leaf"),
			at: ["L1", "leaf"],
			rows: { up: ["home"], down: null, right: null, left: null },
		},
		coexistence: {
			screens: [{ name: "home" }, L1(slideOpts("vertical-inverted"), [leaf("index"), leaf("leaf", slideOpts("vertical"))])],
			reach: open("L1", "leaf"),
			at: ["L1", "leaf"],
			rows: { up: ["home"], down: ["L1", "index"], right: null, left: null },
		},
		"snap-shadows-axis": {
			screens: [{ name: "home" }, L1(slideOpts("vertical"), [leaf("index"), leaf("sheet", sheetOpts(sheetVariant("bottom", [0.5, 0.8], 0)))])],
			reach: open("L1", "sheet"),
			at: ["L1", "sheet"],
			rows: { down: ["L1", "index"], up: null, right: null, left: null },
			after: { up: [{ op: "expectSnap", index: 1 }] },
			rest: { sheet: rects("bottom", [0.5, 0.8]) },
			snapRects: rects("bottom", [0.5, 0.8]),
		},
		"snap-different-axis": {
			screens: [{ name: "home" }, L1(slideOpts("vertical"), [leaf("index"), leaf("drawer", sheetOpts(sheetVariant("right", [0.5, 0.8], 0)))])],
			reach: open("L1", "drawer"),
			at: ["L1", "drawer"],
			rows: { down: ["home"], right: ["L1", "index"], left: null, up: null },
			after: { left: [{ op: "expectSnap", index: 1 }] },
			rest: { drawer: rects("right", [0.5, 0.8]) },
			snapRects: rects("right", [0.5, 0.8]),
		},
		"snap-locked-no-bubble": {
			screens: [
				{ name: "home" },
				L1(slideOpts("vertical"), [
					leaf("index"),
					leaf("sheet", sheetOpts(sheetVariant("bottom", [0, 0.55, 1], 1, { gestureEnabled: false, gestureSnapLocked: true }))),
				]),
			],
			reach: open("L1", "sheet"),
			at: ["L1", "sheet"],
			rows: { down: null, up: null, right: null, left: null },
			// Locked and not dismissable: it stays exactly at 0.55.
			rest: { sheet: rects("bottom", [0.55]) },
		},
	};

	const scenarios: Scenario[] = [];
	for (const [setupName, setup] of Object.entries(setups)) {
		for (const [direction, expected] of Object.entries(setup.rows) as Array<[FingerDirection, string[] | null]>) {
			scenarios.push({
				name: `ownership-${setupName} / preset-spec / swipe-${direction}`,
				screens: setup.screens,
				steps: [
					...setup.reach,
					{ op: "expectPath", names: setup.at },
					{ op: "swipe", direction: FINGER[direction], distance: 0.6, durationMs: 200 },
					{ op: "expectPath", names: expected ?? setup.at },
					...(setup.after?.[direction] ?? []),
				],
				expect: { rest: setup.rest, snapRects: setup.snapRects },
			});
		}
	}
	// claim-fallback: three levels; each swipe down dismisses the nearest owner, then the next.
	scenarios.push({
		name: "ownership-claim-fallback / preset-spec / swipe-down-three-times",
		screens: [
			{ name: "home" },
			L1(slideOpts("vertical"), [
				leaf("index"),
				{ name: "mid", options: slideOpts("vertical"), stack: { screens: [leaf("index"), leaf("top", slideOpts("vertical"))] } },
			]),
		],
		steps: [
			...open("L1", "mid", "top"),
			{ op: "expectPath", names: ["L1", "mid", "top"] },
			{ op: "swipe", direction: "vertical", distance: 0.6, durationMs: 200 },
			{ op: "expectPath", names: ["L1", "mid", "index"] },
			{ op: "swipe", direction: "vertical", distance: 0.6, durationMs: 200 },
			{ op: "expectPath", names: ["L1", "index"] },
			{ op: "swipe", direction: "vertical", distance: 0.6, durationMs: 200 },
			{ op: "expectPath", names: ["home"] },
		],
	});
	return scenarios;
};


// ---------------------------------------------------------------------------
// Gesture options: enablement, activation areas, wrong axes, direction sets,
// pinch, sensitivity and release velocity, runtime option changes.

export const buildGestureOptionCatalog = (interpolate: InterpolateFn): Scenario[] => {
	const base = (direction: SwipeDirection, extra: Record<string, unknown> = {}) => ({
		...slide(direction)(interpolate).options,
		...extra,
	});
	// A zoom-like card that any listed gesture dismisses, for direction sets and pinch.
	const card = (gestureDirection: unknown, extra: Record<string, unknown> = {}) => ({
		gestureEnabled: true,
		gestureDirection,
		transitionSpec: { open: DEFAULT_SPEC, close: DEFAULT_SPEC },
		screenStyleInterpolator: ({ progress }: any) => {
			"worklet";
			return {
				content: {
					style: {
						opacity: interpolate(progress, [0, 1, 2], [0, 1, 1], "clamp"),
						transform: [{ scale: interpolate(progress, [0, 1, 2], [0.8, 1, 1], "clamp") }],
					},
				},
			};
		},
		...extra,
	});
	const swipe = (direction: SwipeDirection, from?: { x: number; y: number }): Step => ({
		op: "swipe",
		direction,
		distance: 0.6,
		durationMs: 200,
		from,
	});
	const cases: Array<{ name: string; options: Record<string, unknown>; act: Step[]; routes: string[] }> = [
		{ name: "disabled", options: base("horizontal", { gestureEnabled: false }), act: [swipe("horizontal")], routes: ["A", "B"] },
		{ name: "wrong-axis", options: base("vertical"), act: [swipe("horizontal")], routes: ["A", "B"] },
		{ name: "wrong-way", options: base("vertical"), act: [swipe("vertical-inverted")], routes: ["A", "B"] },
		{
			name: "edge-area-from-middle",
			options: base("horizontal", { gestureDirection: { gesture: "horizontal", area: "edge" } }),
			act: [swipe("horizontal", { x: 200, y: 422 })],
			routes: ["A", "B"],
		},
		{
			name: "edge-area-from-edge",
			options: base("horizontal", { gestureDirection: { gesture: "horizontal", area: "edge" } }),
			act: [swipe("horizontal", { x: 4, y: 422 })],
			routes: ["A"],
		},
		{
			name: "px-area-inside",
			options: base("vertical", { gestureDirection: [{ gesture: "vertical", area: 96 }, "horizontal"] }),
			act: [swipe("vertical", { x: 195, y: 40 })],
			routes: ["A"],
		},
		{
			name: "px-area-outside",
			options: base("vertical", { gestureDirection: [{ gesture: "vertical", area: 96 }, "horizontal"] }),
			act: [swipe("vertical", { x: 195, y: 300 })],
			routes: ["A", "B"],
		},
		{ name: "array-first", options: card(["horizontal", "vertical"]), act: [swipe("horizontal")], routes: ["A"] },
		{ name: "array-second", options: card(["horizontal", "vertical"]), act: [swipe("vertical")], routes: ["A"] },
		{ name: "array-unlisted", options: card(["horizontal", "vertical"]), act: [swipe("vertical-inverted")], routes: ["A", "B"] },
		{ name: "bidirectional-left", options: card("bidirectional"), act: [swipe("horizontal-inverted")], routes: ["A"] },
		{ name: "bidirectional-up", options: card("bidirectional"), act: [swipe("vertical-inverted")], routes: ["A"] },
		{ name: "pinch-in", options: card("pinch-in"), act: [{ op: "pinch", fromSpan: 300, toSpan: 80, durationMs: 250 }], routes: ["A"] },
		{ name: "pinch-out", options: card("pinch-out"), act: [{ op: "pinch", fromSpan: 100, toSpan: 340, durationMs: 250 }], routes: ["A"] },
		{ name: "pinch-wrong-way", options: card("pinch-in"), act: [{ op: "pinch", fromSpan: 100, toSpan: 340, durationMs: 250 }], routes: ["A", "B"] },
		{ name: "pinch-only-swiped", options: card("pinch-in"), act: [swipe("vertical")], routes: ["A", "B"] },
		{ name: "low-sensitivity", options: base("horizontal", { gestureSensitivity: 0.3 }), act: [swipe("horizontal")], routes: ["A"] },
		{ name: "no-release-velocity", options: base("horizontal", { gestureReleaseVelocityScale: 0 }), act: [swipe("horizontal")], routes: ["A"] },
		{ name: "strong-release-velocity", options: base("horizontal", { gestureReleaseVelocityScale: 2 }), act: [swipe("horizontal")], routes: ["A"] },
		{
			name: "runtime-disable",
			options: base("horizontal"),
			act: [{ op: "setOptions", name: "B", options: { gestureEnabled: false } }, { op: "frames", count: 2 }, swipe("horizontal")],
			routes: ["A", "B"],
		},
		{
			name: "runtime-reenable",
			options: base("horizontal", { gestureEnabled: false }),
			act: [{ op: "setOptions", name: "B", options: { gestureEnabled: true } }, { op: "frames", count: 2 }, swipe("horizontal")],
			routes: ["A"],
		},
		{
			name: "runtime-direction",
			options: base("horizontal"),
			act: [{ op: "setOptions", name: "B", options: { gestureDirection: "vertical" } }, { op: "frames", count: 2 }, swipe("vertical")],
			routes: ["A"],
		},
	];
	return cases.map(({ name, options, act, routes }) => ({
		name: `gesture-${name} / preset-spec / push-then-gesture`,
		screens: [{ name: "A" }, { name: "B", options }],
		steps: [{ op: "push", name: "B" }, { op: "settle" }, ...act, { op: "expectRoutes", names: routes }],
		expect: { mayOvershoot: true },
	}));
};


// ---------------------------------------------------------------------------
// inactiveBehavior: what a screen two levels down does, and that it comes back.

export const buildInactiveCatalog = (interpolate: InterpolateFn): Scenario[] => {
	const slideOptions = slide("horizontal")(interpolate).options;
	const expected = { keep: "shown", pause: "shown", hide: "hidden", unmount: "absent" } as const;
	const scenarios: Scenario[] = [];
	for (const behavior of ["keep", "pause", "hide", "unmount"] as const) {
		const screens = [
			{ name: "A", options: { ...slideOptions, inactiveBehavior: behavior } },
			{ name: "B", options: slideOptions },
			{ name: "C", options: slideOptions },
		];
		scenarios.push({
			name: `inactive-${behavior} / preset-spec / cover-and-return`,
			screens,
			steps: [
				{ op: "push", name: "B" },
				{ op: "settle" },
				{ op: "expectScene", name: "A", state: "shown" },
				{ op: "push", name: "C" },
				{ op: "expectScene", name: "A", state: expected[behavior] },
				{ op: "pop" },
				{ op: "expectScene", name: "A", state: "shown" },
				{ op: "pop" },
				{ op: "expectRoutes", names: ["A"] },
			],
		});
		scenarios.push({
			name: `inactive-${behavior} / preset-spec / swipe-back-to-it`,
			screens,
			steps: [
				{ op: "push", name: "B" },
				{ op: "settle" },
				{ op: "push", name: "C" },
				{ op: "settle" },
				{ op: "swipe", direction: "horizontal", distance: 0.75, durationMs: 200 },
				{ op: "expectScene", name: "A", state: "shown" },
				{ op: "swipe", direction: "horizontal", distance: 0.75, durationMs: 200 },
				{ op: "expectRoutes", names: ["A"] },
			],
		});
		const rapid: Step[] = [];
		for (let i = 0; i < 8; i++) rapid.push({ op: "push", name: i % 2 ? "C" : "B" }, { op: "frames", count: 4 });
		rapid.push({ op: "settle" });
		for (let i = 0; i < 8; i++) rapid.push({ op: "pop" }, { op: "frames", count: 4 });
		rapid.push({ op: "expectRoutes", names: ["A"] }, { op: "expectScene", name: "A", state: "shown" });
		scenarios.push({ name: `inactive-${behavior} / preset-spec / rapid-push-pop`, screens, steps: rapid });
	}
	return scenarios;
};


// ---------------------------------------------------------------------------
// Element slots (styleId), style reset, custom layer components, overlays.

export const buildSlotCatalog = (interpolate: InterpolateFn, overlay: unknown): Scenario[] => {
	const content = (progress: number, width: number) => ({
		style: { transform: [{ translateX: interpolate(progress, [0, 1, 2], [width, 0, -width * 0.3]) }] },
	});
	const withHero = (hero: (progress: number, active: any) => Record<string, unknown> | undefined) => ({
		gestureEnabled: true,
		gestureDirection: "horizontal",
		transitionSpec: { open: DEFAULT_SPEC, close: DEFAULT_SPEC },
		screenStyleInterpolator: ({ progress, active, layouts: { screen } }: any) => {
			"worklet";
			const slot = hero(progress, active);
			return { content: content(progress, screen.width), ...(slot ? { hero: slot } : {}) };
		},
	});
	const heroSlots: Record<string, ReturnType<typeof withHero>> = {
		// Styled through the whole motion, identity at rest.
		override: withHero((progress) => ({
			style: {
				opacity: interpolate(progress, [0, 1, 2], [0, 1, 1], "clamp"),
				transform: [{ scale: interpolate(progress, [0, 1, 2], [0.5, 1, 1.2], "clamp") }],
			},
		})),
		// Returned only while animating (identity where it settles), then dropped: nothing may linger.
		"while-animating": withHero((progress, active) =>
			active.settled
				? undefined
				: {
						style: {
							opacity: interpolate(progress, [0, 1, 2], [0.2, 1, 1], "clamp"),
							transform: [{ translateY: interpolate(progress, [0, 1, 2], [120, 0, 0], "clamp") }],
						},
					},
		),
		// Keys that come and go across the motion.
		"changing-keys": withHero((progress) =>
			progress < 0.999
				? { style: { backgroundColor: "red", transform: [{ translateY: 80 * (1 - progress) }] } }
				: { style: { opacity: 1 } },
		),
	};
	const scenarios: Scenario[] = [];
	const heroSequences: Record<string, Step[]> = {
		"push-pop": [
			{ op: "push", name: "B" },
			{ op: "expectElementAtRest", styleId: "hero" },
			{ op: "pop" },
			{ op: "expectElementAtRest", styleId: "hero" },
		],
		"swipe-dismiss": [
			{ op: "push", name: "B" },
			{ op: "settle" },
			{ op: "swipe", direction: "horizontal", distance: 0.75, durationMs: 200 },
			{ op: "expectElementAtRest", styleId: "hero" },
		],
		"swipe-cancel": [
			{ op: "push", name: "B" },
			{ op: "settle" },
			{ op: "swipe", direction: "horizontal", distance: 0.2, durationMs: 300, holdMs: 200 },
			{ op: "expectElementAtRest", styleId: "hero" },
		],
		"pop-mid-push": [{ op: "push", name: "B" }, { op: "frames", count: 6 }, { op: "pop" }, { op: "expectElementAtRest", styleId: "hero" }],
	};
	for (const [slotName, options] of Object.entries(heroSlots)) {
		for (const [sequenceName, steps] of Object.entries(heroSequences)) {
			scenarios.push({
				name: `slot-hero-${slotName} / preset-spec / ${sequenceName}`,
				screens: [
					{ name: "A", elements: ["hero"] },
					{ name: "B", options, elements: ["hero"] },
				],
				screenOptions: options,
				steps,
			});
		}
	}

	// Custom layer components must move exactly like the built-in layers.
	const layer =
		(type: string) =>
		({ styles, props, pointerEvents, children }: any) => {
			// biome-ignore lint/style/noCommonJs: lazy to keep react out of module init order
			const React = require("react") as typeof import("react");
			return React.createElement(type, { style: styles, animatedProps: props, pointerEvents }, children);
		};
	const plain = slide("horizontal")(interpolate).options;
	const componentVariants: Record<string, Record<string, unknown>> = {
		"content-component": { ...plain, contentComponent: layer("AnimatedView") },
		"backdrop-component": { ...plain, backdropComponent: layer("AnimatedView") },
		"surface-component": {
			...plain,
			surfaceComponent: layer("AnimatedView"),
			screenStyleInterpolator: ({ progress, layouts: { screen } }: any) => {
				"worklet";
				return {
					content: content(progress, screen.width),
					surface: { style: { opacity: interpolate(progress, [0, 1, 2], [0.5, 1, 1], "clamp") } },
				};
			},
		},
	};
	for (const [variantName, options] of Object.entries(componentVariants)) {
		for (const [sequenceName, build] of Object.entries(sequences)) {
			const steps = build("horizontal");
			if (!steps || !["push-pop", "swipe-dismiss", "swipe-cancel", "pop-mid-push"].includes(sequenceName)) continue;
			scenarios.push({
				name: `slot-${variantName} / preset-spec / ${sequenceName}`,
				screens: [{ name: "A" }, { name: "B" }, { name: "C" }],
				screenOptions: options,
				steps,
			});
		}
	}

	// Overlays: persist across pushes and show the focused route.
	const withOverlay = { ...plain, overlay, overlayShown: true };
	scenarios.push(
		{
			name: "overlay-on-first / preset-spec / push-pop",
			screens: [{ name: "A", options: withOverlay }, { name: "B", options: plain }],
			steps: [
				{ op: "expectOverlay", focused: "A" },
				{ op: "push", name: "B" },
				{ op: "expectOverlay", focused: "B" },
				{ op: "pop" },
				{ op: "expectOverlay", focused: "A" },
			],
		},
		{
			name: "overlay-on-first / preset-spec / swipe-dismiss",
			screens: [{ name: "A", options: withOverlay }, { name: "B", options: plain }],
			steps: [
				{ op: "push", name: "B" },
				{ op: "settle" },
				{ op: "swipe", direction: "horizontal", distance: 0.75, durationMs: 200 },
				{ op: "expectOverlay", focused: "A" },
			],
		},
		{
			name: "overlay-on-first / preset-spec / rapid",
			screens: [{ name: "A", options: withOverlay }, { name: "B", options: plain }, { name: "C", options: plain }],
			steps: [
				{ op: "push", name: "B" },
				{ op: "frames", count: 3 },
				{ op: "push", name: "C" },
				{ op: "expectOverlay", focused: "C" },
				{ op: "pop" },
				{ op: "pop" },
				{ op: "expectOverlay", focused: "A" },
			],
		},
		{
			name: "overlay-hidden / preset-spec / push-pop",
			screens: [{ name: "A", options: { ...withOverlay, overlayShown: false } }, { name: "B", options: plain }],
			steps: [{ op: "expectOverlay", focused: null }, { op: "push", name: "B" }, { op: "expectOverlay", focused: null }],
		},
	);
	return scenarios;
};


// ---------------------------------------------------------------------------
// stackProgress across a deep stack, and animating the initial screen on mount.

export const buildStackProgressCatalog = (interpolate: InterpolateFn): Scenario[] => {
	// Like the e2e stack-progress example: each pushed card sinks as more stack on top.
	const card = {
		gestureEnabled: true,
		gestureDirection: "vertical",
		transitionSpec: { open: DEFAULT_SPEC, close: DEFAULT_SPEC },
		screenStyleInterpolator: ({ progress, stackProgress, layouts: { screen } }: any) => {
			"worklet";
			const depth = Math.max(0, stackProgress - progress);
			return {
				content: {
					style: {
						transform: [
							{ translateY: interpolate(progress, [0, 1], [screen.height, 0], "clamp") - interpolate(depth, [0, 3], [0, 60], "clamp") },
							{ scale: interpolate(depth, [0, 3], [1, 0.85], "clamp") },
						],
					},
				},
			};
		},
	};
	const screens = [{ name: "A" }, { name: "B", options: card }];
	const deep: Step[] = [];
	for (let i = 0; i < 4; i++) deep.push({ op: "push", name: "B" }, { op: "settle" });
	const popAll: Step[] = [];
	for (let i = 0; i < 4; i++) popAll.push({ op: "pop" }, { op: "settle" });
	const swipeAll: Step[] = [];
	for (let i = 0; i < 4; i++) swipeAll.push({ op: "swipe", direction: "vertical", distance: 0.6, durationMs: 200 }, { op: "settle" });
	const rapid: Step[] = [];
	for (let i = 0; i < 4; i++) rapid.push({ op: "push", name: "B" }, { op: "frames", count: 3 });
	return [
		{ name: "stack-progress / preset-spec / push-four-pop-four", screens, steps: [...deep, ...popAll, { op: "expectRoutes", names: ["A"] }] },
		{ name: "stack-progress / preset-spec / push-four-swipe-four", screens, steps: [...deep, ...swipeAll, { op: "expectRoutes", names: ["A"] }] },
		{ name: "stack-progress / preset-spec / rapid-push", screens, steps: [...rapid, { op: "settle" }, { op: "expectRoutes", names: ["A", "B", "B", "B", "B"] }] },
		{
			name: "initial-mount / preset-spec / animates-in",
			screens: [{ name: "A", options: { ...slide("vertical")(interpolate).options, experimental_animateOnInitialMount: true } }],
			steps: [{ op: "expectRoutes", names: ["A"] }],
		},
	];
};


// ---------------------------------------------------------------------------
// Scroll handoff: a Transition.ScrollView inside a dismissable screen or sheet.

export const buildScrollCatalog = (interpolate: InterpolateFn, window: { width: number; height: number }): Scenario[] => {
	const content = 2000;
	const down = (distance: number): Step => ({ op: "swipe", direction: "vertical", distance, durationMs: 250 });
	const up = (distance: number): Step => ({ op: "swipe", direction: "vertical-inverted", distance, durationMs: 250 });
	const screen = { ...slide("vertical")(interpolate).options };
	const sheet = (behavior: "expand-and-collapse" | "collapse-only") =>
		sheetOptions(
			{ edge: "bottom", snapPoints: [0.4, 0.7, 1], initialSnapIndex: 1, extra: { sheetScrollGestureBehavior: behavior } },
			interpolate,
		);
	const snapRects = [0.4, 0.7, 1].map((s) => sheetRect("bottom", s, window));
	const boundary = (name: string, steps: Step[]): Scenario => ({
		name: `scroll-boundary / preset-spec / ${name}`,
		screens: [{ name: "A" }, { name: "S", options: screen, scroll: { contentSize: content } }],
		steps: [{ op: "push", name: "S" }, { op: "settle" }, ...steps],
	});
	const sheetCase = (behavior: "expand-and-collapse" | "collapse-only", name: string, steps: Step[]): Scenario => ({
		name: `scroll-sheet-${behavior} / preset-spec / ${name}`,
		screens: [{ name: "A" }, { name: "S", options: sheet(behavior), scroll: { contentSize: content } }],
		steps: [{ op: "push", name: "S" }, { op: "settle" }, ...steps],
		expect: { snapRects, rest: { S: snapRects } },
	});
	return [
		boundary("at-top-swipe-down-dismisses", [down(0.6), { op: "expectRoutes", names: ["A"] }]),
		boundary("scrolled-swipe-down-scrolls", [
			{ op: "scrollTo", offset: 400 },
			down(0.2),
			{ op: "expectRoutes", names: ["A", "S"] },
			{ op: "expectScroll", max: 399 },
		]),
		boundary("scrolled-swipe-up-scrolls", [
			{ op: "scrollTo", offset: 400 },
			up(0.2),
			{ op: "expectRoutes", names: ["A", "S"] },
			{ op: "expectScroll", min: 401 },
		]),
		sheetCase("expand-and-collapse", "at-top-swipe-up-expands", [up(0.25), { op: "expectSnap", index: 2 }, { op: "expectScroll", max: 0 }]),
		sheetCase("expand-and-collapse", "full-swipe-up-scrolls", [
			{ op: "snapTo", index: 2 },
			{ op: "settle" },
			up(0.2),
			{ op: "expectSnap", index: 2 },
			{ op: "expectScroll", min: 1 },
		]),
		sheetCase("expand-and-collapse", "full-scrolled-swipe-down-scrolls", [
			{ op: "snapTo", index: 2 },
			{ op: "settle" },
			{ op: "scrollTo", offset: 400 },
			down(0.15),
			{ op: "expectSnap", index: 2 },
			{ op: "expectScroll", max: 399 },
		]),
		sheetCase("expand-and-collapse", "full-at-top-swipe-down-collapses", [
			{ op: "snapTo", index: 2 },
			{ op: "settle" },
			down(0.15),
			{ op: "expectRoutes", names: ["A", "S"] },
			{ op: "expectScroll", max: 0 },
		]),
		sheetCase("collapse-only", "at-top-swipe-up-scrolls", [up(0.2), { op: "expectSnap", index: 1 }, { op: "expectScroll", min: 1 }]),
		sheetCase("collapse-only", "at-top-swipe-down-collapses", [down(0.15), { op: "expectScroll", max: 0 }]),
	];
};


// ---------------------------------------------------------------------------
// Bounds: zoom, styles() and reveal() from a measured Transition.Boundary.

export const buildBoundsCatalog = (interpolate: InterpolateFn, window: { width: number; height: number }, specs: { Zoom?: unknown }): Scenario[] => {
	const card = { x: window.width * 0.1, y: window.height * 0.24, width: window.width * 0.36, height: window.height * 0.21 };
	const cardCenter = { x: card.x + card.width / 2, y: card.y + card.height / 2 };
	const full = { x: 0, y: 0, ...window };
	const zoomSpec = specs.Zoom ?? DEFAULT_SPEC;
	const source = { name: "A", bounds: [{ id: "card", rect: card, pushTo: "Z" }] };
	const zoom = (zoomOptions?: Record<string, unknown>) => ({
		gestureEnabled: true,
		gestureDirection: ["bidirectional", "pinch-in"],
		transitionSpec: { open: zoomSpec, close: zoomSpec },
		screenStyleInterpolator: ({ bounds }: any) => {
			"worklet";
			return bounds("card").navigation.zoom(zoomOptions);
		},
	});
	const detailBound = { x: 0, y: 0, width: window.width, height: window.height * 0.4 };
	const tapCard: Step = { op: "tap", at: cardCenter };
	const scenarios: Scenario[] = [];
	const zooms: Record<string, { options: Record<string, unknown>; z: Partial<ScreenSpec> }> = {
		zoom: { options: zoom(), z: {} },
		"zoom-to-bound": { options: zoom({ target: "bound" }), z: { bounds: [{ id: "card", rect: detailBound }] } },
	};
	for (const [zoomName, { options, z }] of Object.entries(zooms)) {
		const screens = [source, { name: "Z", options, ...z }];
		const add = (sequence: string, steps: Step[]) =>
			scenarios.push({ name: `bounds-${zoomName} / zoom-spec / ${sequence}`, screens, steps, expect: { mayOvershoot: true } });
		// zoom: the screen grows out of the card; target "bound": the destination boundary does.
		const moving: Pick<Extract<Step, { op: "expectTrajectory" }>, "scene" | "element"> =
			zoomName === "zoom-to-bound" ? { scene: "Z", element: "bound:card" } : { scene: "Z" };
		const destination = zoomName === "zoom-to-bound" ? detailBound : full;
		add("open-close", [
			tapCard,
			{ op: "expectRoutes", names: ["A", "Z"] },
			{ op: "expectTrajectory", ...moving, from: card, to: destination, tolerance: 60 },
			{ op: "pop" },
			// The zoomed screen fades out as it lands: follow it until it is removed.
			{ op: "expectTrajectory", ...moving, to: card, tolerance: 60, throughFade: true },
			{ op: "expectRoutes", names: ["A"] },
		]);
		add("swipe-dismiss", [
			tapCard,
			{ op: "settle" },
			{ op: "swipe", direction: "vertical", distance: 0.5, durationMs: 250 },
			{ op: "expectRoutes", names: ["A"] },
		]);
		add("swipe-cancel", [
			tapCard,
			{ op: "settle" },
			{ op: "swipe", direction: "vertical", distance: 0.1, durationMs: 300, holdMs: 200 },
			{ op: "expectRoutes", names: ["A", "Z"] },
			{ op: "expectTrajectory", scene: "Z", to: full, tolerance: 2 },
		]);
		add("pinch-dismiss", [tapCard, { op: "settle" }, { op: "pinch", fromSpan: 300, toSpan: 80, durationMs: 250 }, { op: "expectRoutes", names: ["A"] }]);
		add("grab-mid-open", [tapCard, { op: "frames", count: 6 }, { op: "swipe", direction: "vertical", distance: 0.5, durationMs: 250 }]);
		add("pop-mid-open", [tapCard, { op: "frames", count: 6 }, { op: "pop" }, { op: "expectRoutes", names: ["A"] }]);
		add("reopen-after-close", [tapCard, { op: "settle" }, { op: "pop" }, { op: "settle" }, tapCard, { op: "expectRoutes", names: ["A", "Z"] }]);
	}

	// styles(): the destination boundary morphs from the source boundary's rect to its own.
	const morphTarget = { x: window.width * 0.05, y: window.height * 0.12, width: window.width * 0.9, height: window.height * 0.35 };
	const styled = {
		gestureEnabled: true,
		gestureDirection: "vertical",
		transitionSpec: { open: DEFAULT_SPEC, close: DEFAULT_SPEC },
		screenStyleInterpolator: ({ bounds, progress }: any) => {
			"worklet";
			return {
				content: { style: { opacity: interpolate(progress, [0, 1, 2], [0, 1, 1], "clamp") } },
				// A boundary's slot is keyed by its id (as in the e2e app's bounds examples).
				card: bounds("card").styles(),
			};
		},
	};
	const morphScreens = [
		{ name: "A", bounds: [{ id: "card", rect: card, pushTo: "B" }] },
		{ name: "B", options: styled, bounds: [{ id: "card", rect: morphTarget }] },
	];
	scenarios.push(
		{
			name: "bounds-styles / preset-spec / open-close",
			screens: morphScreens,
			steps: [
				tapCard,
				{ op: "expectTrajectory", scene: "B", element: "bound:card", from: card, to: morphTarget, tolerance: 40 },
				{ op: "pop" },
				{ op: "expectTrajectory", scene: "B", element: "bound:card", to: card, tolerance: 40 },
				{ op: "expectRoutes", names: ["A"] },
			],
		},
		{
			name: "bounds-styles / preset-spec / swipe-dismiss",
			screens: morphScreens,
			steps: [tapCard, { op: "settle" }, { op: "swipe", direction: "vertical", distance: 0.6, durationMs: 200 }, { op: "expectRoutes", names: ["A"] }],
		},
	);

	// reveal(): the screen opens out of the source boundary.
	const revealed = {
		gestureEnabled: true,
		gestureDirection: ["vertical", "horizontal"],
		transitionSpec: { open: DEFAULT_SPEC, close: DEFAULT_SPEC },
		screenStyleInterpolator: ({ bounds }: any) => {
			"worklet";
			return bounds("card").navigation.reveal();
		},
	};
	const revealScreens = [
		{ name: "A", bounds: [{ id: "card", rect: card, pushTo: "R" }] },
		{ name: "R", options: revealed, bounds: [{ id: "card", rect: morphTarget }] },
	];
	scenarios.push(
		{
			name: "bounds-reveal / preset-spec / open-close",
			screens: revealScreens,
			steps: [tapCard, { op: "expectRoutes", names: ["A", "R"] }, { op: "pop" }, { op: "expectRoutes", names: ["A"] }],
		},
		{
			name: "bounds-reveal / preset-spec / swipe-dismiss",
			screens: revealScreens,
			steps: [tapCard, { op: "settle" }, { op: "swipe", direction: "vertical", distance: 0.5, durationMs: 250 }, { op: "expectRoutes", names: ["A"] }],
		},
	);
	return scenarios;
};

// ---------------------------------------------------------------------------
// Shared bounds and scroll views: the source card lives in a scrolled list, the destination in a
// scroll view of its own. Every close must land on where the source card is *now*.

export const buildScrollBoundsCatalog = (window: { width: number; height: number }, specs: { Zoom?: unknown }): Scenario[] => {
	const W = window.width;
	const H = window.height;
	const zoomSpec = specs.Zoom ?? DEFAULT_SPEC;
	const full = { x: 0, y: 0, ...window };
	// The card sits far down a long list; scrolled by `listScroll` it shows at 0.2 H.
	const cardContent = { x: W * 0.1, y: H * 1.2, width: W * 0.36, height: H * 0.21 };
	const listScroll = H;
	const cardAt = (offset: number) => ({ ...cardContent, y: cardContent.y - offset });
	const centerOf = (r: { x: number; y: number; width: number; height: number }) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
	const tapCard = (offset = listScroll): Step => ({ op: "tap", at: centerOf(cardAt(offset)) });
	const scrollList = (offset = listScroll): Step => ({ op: "scrollTo", offset });
	const list = { name: "A", scroll: { contentSize: H * 3, bounds: [{ id: "card", rect: cardContent, pushTo: "Z" }] } };
	const zoom = (zoomOptions?: Record<string, unknown>) => ({
		gestureEnabled: true,
		gestureDirection: ["bidirectional", "pinch-in"],
		transitionSpec: { open: zoomSpec, close: zoomSpec },
		screenStyleInterpolator: ({ bounds }: any) => {
			"worklet";
			return bounds("card").navigation.zoom(zoomOptions);
		},
	});
	// The destination's own boundary, at the top of its scroll content.
	// Same aspect ratio as the card, so a zoom only scales and moves.
	const detailContent = { x: 0, y: 0, width: W, height: W * (cardContent.height / cardContent.width) };
	const destinations: Record<string, { screen: ScreenSpec; moving: { scene: string; element?: string }; opened: typeof full }> = {
		// zoom: the whole screen grows from the card and shrinks back into it.
		zoom: { screen: { name: "Z", options: zoom(), scroll: { contentSize: H * 3 } }, moving: { scene: "Z" }, opened: full },
		// keepFocusedVisible: no landing fade, and zoom follows the source list's scroll while it lands.
		"zoom-visible": {
			screen: { name: "Z", options: zoom({ keepFocusedVisible: true }), scroll: { contentSize: H * 3 } },
			moving: { scene: "Z" },
			opened: full,
		},
		// target "bound": the destination's boundary, inside its scroll view, is what lands on the card.
		"zoom-to-bound": {
			screen: { name: "Z", options: zoom({ target: "bound" }), scroll: { contentSize: H * 3, bounds: [{ id: "card", rect: detailContent }] } },
			moving: { scene: "Z", element: "bound:card" },
			opened: detailContent,
		},
	};
	const scenarios: Scenario[] = [];
	for (const [kind, { screen, moving, opened }] of Object.entries(destinations)) {
		const screens = [list, screen];
		const add = (sequence: string, steps: Step[]) =>
			scenarios.push({ name: `scroll-bounds-${kind} / zoom-spec / ${sequence}`, screens, steps, expect: { mayOvershoot: true } });
		const closesOnto = (rect: typeof full): Step => ({ op: "expectTrajectory", ...moving, to: rect, tolerance: 40, throughFade: true });

		// Opening measures the card where it is in the scrolled list, and closing returns there.
		add("open-close-from-scrolled-list", [
			scrollList(),
			tapCard(),
			{ op: "expectTrajectory", ...moving, from: cardAt(listScroll), to: opened, tolerance: 40 },
			{ op: "pop" },
			closesOnto(cardAt(listScroll)),
		]);
		// The user scrolls the destination, then goes back: it must still land on the card.
		add("scroll-destination-then-close", [scrollList(), tapCard(), { op: "settle" }, { op: "scrollTo", offset: H * 0.25 }, { op: "pop" }, closesOnto(cardAt(listScroll))]);
		// The destination's boundary is scrolled fully out of view. Rule: close as a plain zoom of the
		// screen into the card; nothing flies in from off screen.
		add("destination-bound-scrolled-away-then-close", [
			scrollList(),
			tapCard(),
			{ op: "settle" },
			{ op: "scrollTo", offset: H * 1.2 },
			{ op: "pop" },
			{ op: "expectTrajectory", scene: "Z", to: cardAt(listScroll), tolerance: 40, throughFade: true },
		]);
		// The list under the destination moved while it was covered (new rows, a restored offset).
		add("list-moved-while-covered-then-close", [
			scrollList(),
			tapCard(),
			{ op: "settle" },
			{ op: "scrollTo", screen: "A", offset: listScroll + H * 0.3 },
			{ op: "pop" },
			closesOnto(cardAt(listScroll + H * 0.3)),
		]);
		// The list scrolls while the detail is closing back into it (a flick right after Back): the close
		// follows the card to where it is now.
		add("list-scrolls-during-close", [
			scrollList(),
			tapCard(),
			{ op: "settle" },
			{ op: "pop" },
			{ op: "frames", count: 6 },
			// A flick: 0.3 H over ten frames.
			...Array.from({ length: 10 }, (_, i): Step => ({ op: "scrollTo", screen: "A", offset: listScroll + H * 0.03 * (i + 1) })),
			closesOnto(cardAt(listScroll + H * 0.3)),
		]);
		// The card is partly scrolled off the top when tapped: open from its true rect, close back to it.
		add("card-partly-off-screen", [
			scrollList(listScroll + H * 0.3),
			{ op: "tap", at: { x: centerOf(cardAt(listScroll + H * 0.3)).x, y: cardAt(listScroll + H * 0.3).y + cardContent.height * 0.8 } },
			{ op: "expectTrajectory", ...moving, from: cardAt(listScroll + H * 0.3), to: opened, tolerance: 40 },
			{ op: "pop" },
			closesOnto(cardAt(listScroll + H * 0.3)),
		]);
		// A swipe back after scrolling the destination (horizontal: the vertical axis belongs to its scroll view).
		add("scroll-destination-then-swipe-back", [
			scrollList(),
			tapCard(),
			{ op: "settle" },
			{ op: "scrollTo", offset: H * 0.25 },
			{ op: "swipe", direction: "horizontal", distance: 0.6, durationMs: 250 },
			{ op: "expectRoutes", names: ["A"] },
			closesOnto(cardAt(listScroll)),
		]);
		// Spam: open, pop mid-open, open again, from the scrolled list.
		add("open-pop-open-from-scrolled-list", [
			scrollList(),
			tapCard(),
			{ op: "frames", count: 6 },
			{ op: "pop" },
			{ op: "frames", count: 4 },
			tapCard(),
			{ op: "expectRoutes", names: ["A", "Z"] },
			{ op: "pop" },
			closesOnto(cardAt(listScroll)),
		]);
	}

	// Nested: the card sits in a horizontal carousel inside the vertical list. The close follows both
	// scroll views, whichever moves.
	const carousel = { x: 0, y: cardContent.y - 10, width: W, height: cardContent.height + 20 };
	const cardInCarousel = { x: W * 1.1, y: 10, width: cardContent.width, height: cardContent.height };
	const carouselScroll = W * 0.9;
	const nestedCardAt = (list: number, inner: number) => ({
		...cardInCarousel,
		x: carousel.x + cardInCarousel.x - inner,
		y: carousel.y + cardInCarousel.y - list,
	});
	const nestedList = {
		name: "A",
		scroll: {
			contentSize: H * 3,
			inner: { rect: carousel, contentSize: W * 3, horizontal: true, bounds: [{ id: "card", rect: cardInCarousel, pushTo: "Z" }] },
		},
	};
	const openNested = (): Step[] => [
		scrollList(),
		{ op: "scrollTo", offset: carouselScroll, inner: true },
		{ op: "tap", at: centerOf(nestedCardAt(listScroll, carouselScroll)) },
	];
	for (const [kind, { screen, moving, opened }] of Object.entries(destinations)) {
		const screens = [nestedList, screen];
		const add = (sequence: string, steps: Step[]) =>
			scenarios.push({ name: `scroll-bounds-${kind} / zoom-spec / nested-${sequence}`, screens, steps, expect: { mayOvershoot: true } });
		const closesOnto = (rect: typeof full): Step => ({ op: "expectTrajectory", ...moving, to: rect, tolerance: 40, throughFade: true });

		add("open-close", [
			...openNested(),
			{ op: "expectTrajectory", ...moving, from: nestedCardAt(listScroll, carouselScroll), to: opened, tolerance: 40 },
			{ op: "pop" },
			closesOnto(nestedCardAt(listScroll, carouselScroll)),
		]);
		// The carousel moved while covered: land on the card's new place in it.
		add("carousel-moved-while-covered-then-close", [
			...openNested(),
			{ op: "settle" },
			{ op: "scrollTo", screen: "A", inner: true, offset: carouselScroll + W * 0.25 },
			{ op: "pop" },
			closesOnto(nestedCardAt(listScroll, carouselScroll + W * 0.25)),
		]);
		// Both scroll during the close (a diagonal flick right after Back).
		add("list-and-carousel-scroll-during-close", [
			...openNested(),
			{ op: "settle" },
			{ op: "pop" },
			{ op: "frames", count: 6 },
			// Each scrollTo is a frame: ten frames in all, alternating the two scroll views.
			...Array.from({ length: 5 }, (_, i): Step[] => [
				{ op: "scrollTo", screen: "A", offset: listScroll + H * 0.04 * (i + 1) },
				{ op: "scrollTo", screen: "A", inner: true, offset: carouselScroll + W * 0.04 * (i + 1) },
			]).flat(),
			closesOnto(nestedCardAt(listScroll + H * 0.2, carouselScroll + W * 0.2)),
		]);
	}
	return scenarios;
};

// ---------------------------------------------------------------------------
// Shared bounds over longer flows: chains (A → B → C → D, each middle screen the destination of
// one pair and the source of the next), fast pushes and pops through them, deep pops, and a zoom
// from an outer stack into a nested one. Every landing must be on the card that opened it.

export const buildBoundsChainCatalog = (window: { width: number; height: number }, specs: { Zoom?: unknown }): Scenario[] => {
	const W = window.width;
	const H = window.height;
	const zoomSpec = specs.Zoom ?? DEFAULT_SPEC;
	const full = { x: 0, y: 0, ...window };
	// Every screen's source card sits low; a zoom-to-bound destination boundary sits at the top.
	const card = { x: W * 0.1, y: H * 0.6, width: W * 0.36, height: H * 0.2 };
	const top = { x: 0, y: 0, width: W, height: W * (card.height / card.width) };
	const centerOf = (r: typeof card) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
	const zoom = (zoomOptions?: Record<string, unknown>) => ({
		gestureEnabled: true,
		gestureDirection: ["bidirectional", "pinch-in"],
		transitionSpec: { open: zoomSpec, close: zoomSpec },
		// The pair is named by the card that opened the screen (its route's params.id).
		screenStyleInterpolator: (props: any) => {
			"worklet";
			const id = props.active?.route?.params?.id ?? props.current?.route?.params?.id;
			if (!id) return {};
			return props.bounds(id).navigation.zoom(zoomOptions);
		},
	});
	const LEVELS = ["A", "B", "C", "D"];
	const pairId = (i: number) => `${LEVELS[i]}${LEVELS[i + 1]}`.toLowerCase();
	const kinds: Record<string, { options: Record<string, unknown>; bound: boolean }> = {
		zoom: { options: zoom(), bound: false },
		"zoom-to-bound": { options: zoom({ target: "bound" }), bound: true },
	};
	const scenarios: Scenario[] = [];
	for (const [kind, { options, bound }] of Object.entries(kinds)) {
		const screens: ScreenSpec[] = LEVELS.map((name, i) => {
			const sources = i + 1 < LEVELS.length ? [{ id: pairId(i), rect: card, pushTo: LEVELS[i + 1] }] : [];
			const destination = i > 0 && bound ? [{ id: pairId(i - 1), rect: top }] : [];
			return { name, ...(i > 0 ? { options } : {}), bounds: [...destination, ...sources] };
		});
		// What lands on the card when level `i` closes: the screen, or its destination boundary.
		const moving = (i: number) => (bound ? { scene: LEVELS[i], element: `bound:${pairId(i - 1)}` } : { scene: LEVELS[i] });
		const opened = bound ? top : full;
		const closesOnto = (i: number): Step => ({ op: "expectTrajectory", ...moving(i), to: card, tolerance: 40, throughFade: true });
		const add = (sequence: string, steps: Step[]) =>
			scenarios.push({ name: `bounds-chain-${kind} / zoom-spec / ${sequence}`, screens, steps, expect: { mayOvershoot: true } });
		const tapCard: Step = { op: "tap", at: centerOf(card) };

		// Step through the chain by tapping, then come all the way back, one level at a time.
		add("open-chain-then-close-chain", [
			tapCard,
			{ op: "expectTrajectory", ...moving(1), from: card, to: opened, tolerance: 40 },
			tapCard,
			{ op: "expectTrajectory", ...moving(2), from: card, to: opened, tolerance: 40 },
			tapCard,
			{ op: "expectTrajectory", ...moving(3), from: card, to: opened, tolerance: 40 },
			{ op: "expectRoutes", names: LEVELS },
			{ op: "pop" },
			closesOnto(3),
			{ op: "pop" },
			closesOnto(2),
			{ op: "pop" },
			closesOnto(1),
			{ op: "expectRoutes", names: ["A"] },
		]);
		// Spam down the chain (each push lands mid-open of the last), then back up the same way.
		add("fast-push-chain-then-fast-pop-chain", [
			{ op: "push", name: "B", params: { id: pairId(0) } },
			{ op: "frames", count: 5 },
			{ op: "push", name: "C", params: { id: pairId(1) } },
			{ op: "frames", count: 5 },
			{ op: "push", name: "D", params: { id: pairId(2) } },
			{ op: "frames", count: 5 },
			{ op: "pop" },
			{ op: "frames", count: 4 },
			{ op: "pop" },
			{ op: "frames", count: 4 },
			{ op: "pop" },
			{ op: "expectRoutes", names: ["A"] },
			{ op: "expectScene", name: "A", state: "shown" },
		]);
		// Deep, then pop two levels in quick succession: the middle screen closes mid-flight.
		add("deep-then-double-pop", [
			{ op: "push", name: "B", params: { id: pairId(0) } },
			{ op: "settle" },
			{ op: "push", name: "C", params: { id: pairId(1) } },
			{ op: "settle" },
			{ op: "push", name: "D", params: { id: pairId(2) } },
			{ op: "settle" },
			{ op: "pop" },
			{ op: "frames", count: 3 },
			{ op: "pop" },
			{ op: "expectRoutes", names: ["A", "B"] },
			closesOnto(2),
			{ op: "pop" },
			closesOnto(1),
			{ op: "expectRoutes", names: ["A"] },
		]);
		// Drag every level away in quick succession: each drag starts while the level above is still
		// closing, so each screen must follow its own drag, not the closing screen above it.
		const drag: Step = { op: "swipe", direction: "vertical", distance: 0.6, durationMs: 200 };
		add("drag-chain-quickly", [
			tapCard,
			{ op: "settle" },
			tapCard,
			{ op: "settle" },
			tapCard,
			{ op: "settle" },
			drag,
			{ op: "frames", count: 3 },
			drag,
			{ op: "frames", count: 3 },
			drag,
			{ op: "settle" },
			{ op: "expectRoutes", names: ["A"] },
			{ op: "expectScene", name: "A", state: "shown" },
		]);
		// Drag the middle screen the moment the top one is released (a thumb flicking twice).
		add("drag-middle-right-after", [
			tapCard,
			{ op: "settle" },
			tapCard,
			{ op: "settle" },
			{ op: "swipe", direction: "vertical", distance: 0.5, durationMs: 200 },
			{ op: "frames", count: 1 },
			{ op: "swipe", direction: "vertical", distance: 0.5, durationMs: 450 },
			{ op: "settle" },
			{ op: "expectRoutes", names: ["A"] },
			{ op: "expectScene", name: "A", state: "shown" },
		]);
		// Drag the middle screen while the top one is half way through closing.
		add("drag-middle-mid-close", [
			tapCard,
			{ op: "settle" },
			tapCard,
			{ op: "settle" },
			drag,
			{ op: "frames", count: 6 },
			drag,
			{ op: "settle" },
			{ op: "expectRoutes", names: ["A"] },
			{ op: "expectScene", name: "A", state: "shown" },
		]);
		// Back and forth in the middle of a chain: B is a destination (from A) and a source (to C).
		add("middle-reopen", [
			tapCard,
			{ op: "settle" },
			tapCard,
			{ op: "settle" },
			{ op: "pop" },
			closesOnto(2),
			tapCard,
			{ op: "expectTrajectory", ...moving(2), from: card, to: opened, tolerance: 40 },
			{ op: "pop" },
			closesOnto(2),
			{ op: "pop" },
			closesOnto(1),
			{ op: "expectRoutes", names: ["A"] },
		]);
	}

	// Nested: a card in the outer stack zooms into the first screen of a nested stack, whose own
	// card zooms one level deeper inside it.
	const nested: ScreenSpec[] = [
		{ name: "A", bounds: [{ id: "an", rect: card, pushTo: "N" }] },
		{
			name: "N",
			options: zoom(),
			stack: {
				screens: [
					{ name: "N1", bounds: [{ id: "n12", rect: card, pushTo: "N2" }] },
					{ name: "N2", options: zoom() },
				],
			},
		},
	];
	scenarios.push({
		name: "bounds-chain-nested / zoom-spec / outer-into-nested-and-deeper",
		screens: nested,
		expect: { mayOvershoot: true },
		steps: [
			{ op: "tap", at: centerOf(card) },
			{ op: "expectTrajectory", scene: "N1", from: card, to: full, tolerance: 40 },
			{ op: "tap", at: centerOf(card) },
			{ op: "expectTrajectory", scene: "N2", from: card, to: full, tolerance: 40 },
			{ op: "expectPath", names: ["N", "N2"] },
			{ op: "pop" },
			{ op: "expectTrajectory", scene: "N2", to: card, tolerance: 40, throughFade: true },
			{ op: "pop" },
			{ op: "expectTrajectory", scene: "N1", to: card, tolerance: 40, throughFade: true },
			{ op: "expectPath", names: ["A"] },
		],
	});
	return scenarios;
};

// Shared bounds across the route tree: a source and its destination can sit at any depth of nested
// stacks, in sibling stacks, high in a long stack, or under screens pushed over the destination. A
// pair is source screen -> destination screen wherever they are; every open must grow from the card
// and every close land back on it.
export const buildGlobalBoundsCatalog = (window: { width: number; height: number }, specs: { Zoom?: unknown }): Scenario[] => {
	const W = window.width;
	const H = window.height;
	const zoomSpec = specs.Zoom ?? DEFAULT_SPEC;
	const full = { x: 0, y: 0, ...window };
	const card = { x: W * 0.1, y: H * 0.6, width: W * 0.36, height: H * 0.2 };
	const centerOf = (r: typeof card) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
	// The card's id from the route's params, or from its nested screen's (a container screen opened
	// onto the destination inside it).
	const zoom = () => ({
		gestureEnabled: true,
		gestureDirection: ["bidirectional", "pinch-in"],
		transitionSpec: { open: zoomSpec, close: zoomSpec },
		screenStyleInterpolator: (props: any) => {
			"worklet";
			const params = props.active?.route?.params ?? props.current?.route?.params;
			const id = params?.id ?? params?.params?.id;
			if (!id) return {};
			return props.bounds(id).navigation.zoom();
		},
	});
	const slideUp = {
		gestureEnabled: true,
		gestureDirection: "vertical",
		transitionSpec: { open: DEFAULT_SPEC, close: DEFAULT_SPEC },
		screenStyleInterpolator: ({ progress }: any) => {
			"worklet";
			return { content: { style: { transform: [{ translateY: (1 - Math.min(progress, 1)) * H }] } } };
		},
	};
	const source = (pushTo?: string, navigateTo?: { name: string; screen?: string }) => [{ id: "card", rect: card, pushTo, navigateTo }];
	type Topology = {
		screens: ScreenSpec[];
		/** The leaf screen that grows out of the card. */
		destination: string;
		openPath: string[];
		closedPath: string[];
		/** Steps that bring the source on screen first. */
		before?: Step[];
	};
	const topologies: Record<string, Topology> = {
		"nested-source-to-root": {
			screens: [{ name: "Home", stack: { screens: [{ name: "List", bounds: source("Detail") }] } }, { name: "Detail", options: zoom() }],
			destination: "Detail",
			openPath: ["Detail"],
			closedPath: ["Home", "List"],
		},
		"deep-source-to-root": {
			screens: [
				{ name: "Home", stack: { screens: [{ name: "Inner", stack: { screens: [{ name: "List", bounds: source("Detail") }] } }] } },
				{ name: "Detail", options: zoom() },
			],
			destination: "Detail",
			openPath: ["Detail"],
			closedPath: ["Home", "Inner", "List"],
		},
		"root-source-to-nested-dest": {
			screens: [{ name: "List", bounds: source("Deep") }, { name: "Deep", options: zoom(), stack: { screens: [{ name: "Dest" }] } }],
			destination: "Dest",
			openPath: ["Deep", "Dest"],
			closedPath: ["List"],
		},
		"root-source-to-deep-dest": {
			screens: [
				{ name: "List", bounds: source("Deep") },
				{ name: "Deep", options: zoom(), stack: { screens: [{ name: "Mid", stack: { screens: [{ name: "Dest" }] } }] } },
			],
			destination: "Dest",
			openPath: ["Deep", "Mid", "Dest"],
			closedPath: ["List"],
		},
		"sibling-stacks": {
			screens: [
				{ name: "A", stack: { screens: [{ name: "List", bounds: source(undefined, { name: "B", screen: "Detail" }) }] } },
				{ name: "B", options: zoom(), stack: { screens: [{ name: "Hub" }, { name: "Detail" }] } },
			],
			destination: "Detail",
			openPath: ["B", "Detail"],
			closedPath: ["A", "List"],
		},
		// Independent NavigationContainers (NavigationIndependentTree): no shared navigation state, the
		// pairing goes through the bounds registry alone.
		"independent-source-to-outer": {
			screens: [{ name: "Home", stack: { independent: true, screens: [{ name: "List", bounds: source("Detail") }] } }, { name: "Detail", options: zoom() }],
			destination: "Detail",
			openPath: ["Detail"],
			closedPath: ["Home", "List"],
		},
		"outer-source-to-independent-dest": {
			screens: [{ name: "List", bounds: source("Deep") }, { name: "Deep", options: zoom(), stack: { independent: true, screens: [{ name: "Dest" }] } }],
			destination: "Dest",
			openPath: ["Deep", "Dest"],
			closedPath: ["List"],
		},
		"inside-independent": {
			screens: [
				{ name: "Root" },
				{
					name: "Home",
					stack: { independent: true, screens: [{ name: "List", bounds: source("Detail") }, { name: "Detail", options: zoom() }] },
				},
			],
			destination: "Detail",
			openPath: ["Home", "Detail"],
			closedPath: ["Home", "List"],
			before: [{ op: "push", name: "Home" }, { op: "settle" }],
		},
		"independent-to-independent": {
			screens: [
				{ name: "A", stack: { independent: true, screens: [{ name: "List", bounds: source("B") }] } },
				{ name: "B", options: zoom(), stack: { independent: true, screens: [{ name: "Dest" }] } },
			],
			destination: "Dest",
			openPath: ["B", "Dest"],
			closedPath: ["A", "List"],
		},
		"deep-stack": {
			screens: [{ name: "S1" }, { name: "S2" }, { name: "S3" }, { name: "List", bounds: source("Detail") }, { name: "Detail", options: zoom() }],
			destination: "Detail",
			openPath: ["Detail"],
			closedPath: ["List"],
			before: [{ op: "push", name: "S2" }, { op: "push", name: "S3" }, { op: "push", name: "List" }, { op: "settle" }],
		},
	};
	const scenarios: Scenario[] = [];
	for (const [topology, { screens, destination, openPath, closedPath, before = [] }] of Object.entries(topologies)) {
		const add = (sequence: string, steps: Step[]) =>
			scenarios.push({
				name: `bounds-global-${topology} / zoom-spec / ${sequence}`,
				screens,
				steps: [...before, ...steps],
				expect: { mayOvershoot: true },
			});
		const tapCard: Step = { op: "tap", at: centerOf(card) };
		const opens: Step = { op: "expectTrajectory", scene: destination, from: card, to: full, tolerance: 40 };
		const closesOnto: Step = { op: "expectTrajectory", scene: destination, to: card, tolerance: 40, throughFade: true };
		add("open-close", [tapCard, opens, { op: "expectPath", names: openPath }, { op: "pop" }, closesOnto, { op: "expectPath", names: closedPath }]);
		add("pop-mid-open", [tapCard, { op: "frames", count: 6 }, { op: "pop" }, closesOnto, { op: "expectPath", names: closedPath }]);
		add("open-pop-open", [
			tapCard,
			{ op: "frames", count: 6 },
			{ op: "pop" },
			{ op: "frames", count: 4 },
			tapCard,
			{ op: "expectPath", names: openPath },
			{ op: "pop" },
			closesOnto,
			{ op: "expectPath", names: closedPath },
		]);
		add("swipe-dismiss", [
			tapCard,
			{ op: "settle" },
			{ op: "swipe", direction: "vertical", distance: 0.5, durationMs: 250 },
			closesOnto,
			{ op: "expectPath", names: closedPath },
		]);
	}
	// Screens over the destination, popped in quick succession: the destination closes onto the card
	// while the screens above it are still leaving.
	scenarios.push({
		name: "bounds-global-covered-destination / zoom-spec / pop-three-quickly",
		screens: [{ name: "List", bounds: source("Detail") }, { name: "Detail", options: zoom() }, { name: "X", options: slideUp }, { name: "Y", options: slideUp }],
		expect: { mayOvershoot: true },
		steps: [
			{ op: "tap", at: centerOf(card) },
			{ op: "settle" },
			{ op: "push", name: "X" },
			{ op: "settle" },
			{ op: "push", name: "Y" },
			{ op: "settle" },
			{ op: "pop" },
			{ op: "frames", count: 3 },
			{ op: "pop" },
			{ op: "frames", count: 3 },
			{ op: "pop" },
			{ op: "expectTrajectory", scene: "Detail", to: card, tolerance: 40, throughFade: true },
			{ op: "expectRoutes", names: ["List"] },
		],
	});
	return scenarios;
};

/**
 * Handoff (true shared elements): one live payload moves between matching `handoff` boundaries
 * instead of a copy on each screen. As designed, only the boundaries animate (transform and size),
 * through the usual sequences plus spam, from a scrolled list, into a scrolled destination and
 * across stacks.
 * Besides the usual rules, the payload must never be hidden and must rest on its card (closed) or
 * on the destination slot (open).
 */
export const buildHandoffCatalog = (window: { width: number; height: number }, specs: { Zoom?: unknown }): Scenario[] => {
	const W = window.width;
	const H = window.height;
	const spec = specs.Zoom ?? DEFAULT_SPEC;
	const card = { x: W * 0.1, y: H * 0.6, width: W * 0.36, height: H * 0.2 };
	const hero = { x: 0, y: H * 0.1, width: W, height: H * 0.4 };
	const centerOf = (r: typeof card) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
	const shift = (r: typeof card, dy: number) => ({ ...r, y: r.y + dy });
	// Handoff as designed: the screens stay still, only the boundaries animate (the live payload is in
	// the receiving screen and takes whatever that screen does).
	const recipes: Record<string, (props: any) => any> = {
		transform: (props: any) => {
			"worklet";
			return { card: { style: props.bounds("card").styles() } };
		},
		size: (props: any) => {
			"worklet";
			return { card: { style: props.bounds("card").styles({ method: "size" }) } };
		},
	};
	const source = (pushTo?: string) => ({ id: "card", rect: card, pushTo, handoff: true, payload: true });
	// A scroll the way a finger does it: 20 px a frame, not one jump.
	const scrollBy = (to: number): Step[] =>
		Array.from({ length: Math.ceil(to / 20) }, (_, i) => [
			{ op: "scrollTo", offset: Math.min(to, (i + 1) * 20) } as Step,
			{ op: "frames", count: 1 } as Step,
		]).flat();
	const destination = { id: "card", rect: hero, handoff: true };
	type Topology = {
		screens: (options: Record<string, unknown>) => ScreenSpec[];
		openPath: string[];
		closedPath: string[];
		/** The card on screen when closed, and the slot when open (after `before` / `whileOpen`). */
		closedRest: typeof card;
		openRest: typeof card;
		before?: Step[];
		/** Steps run while the destination is open and settled (scrolling it). */
		whileOpen?: Step[];
		/** Before a swipe dismiss: a scrolled destination is scrolled back to its top first (a swipe on a
		 * scrolled list scrolls it, it dismisses only at the top). */
		beforeDismiss?: Step[];
		tapAt: { x: number; y: number };
	};
	const SCROLL = H * 0.5;
	const topologies: Record<string, Topology> = {
		"same-stack": {
			screens: (options) => [{ name: "List", bounds: [source("Detail")] }, { name: "Detail", options, bounds: [destination] }],
			openPath: ["Detail"],
			closedPath: ["List"],
			closedRest: card,
			openRest: hero,
			tapAt: centerOf(card),
		},
		// The card sits further down a list scrolled up by SCROLL: it is on screen at the same place.
		"scrolled-source": {
			screens: (options) => [
				{ name: "List", scroll: { contentSize: H * 2, bounds: [{ ...source("Detail"), rect: shift(card, SCROLL) }] } },
				{ name: "Detail", options, bounds: [destination] },
			],
			openPath: ["Detail"],
			closedPath: ["List"],
			closedRest: card,
			openRest: hero,
			before: [...scrollBy(SCROLL), { op: "settle" }],
			tapAt: centerOf(card),
		},
		// The slot is in the destination's scroll content, scrolled by 200 before closing.
		"scrolled-destination": {
			screens: (options) => [
				{ name: "List", bounds: [source("Detail")] },
				{ name: "Detail", options, scroll: { contentSize: H * 2, bounds: [destination] } },
			],
			openPath: ["Detail"],
			closedPath: ["List"],
			closedRest: card,
			openRest: shift(hero, -200),
			whileOpen: [...scrollBy(200), { op: "settle" }],
			beforeDismiss: [
				...Array.from({ length: 10 }, (_, i) => [
					{ op: "scrollTo", offset: 200 - (i + 1) * 20 } as Step,
					{ op: "frames", count: 1 } as Step,
				]).flat(),
				{ op: "settle" },
			],
			tapAt: centerOf(card),
		},
		"cross-stack": {
			screens: (options) => [
				{ name: "Home", stack: { screens: [{ name: "List", bounds: [source("Detail")] }] } },
				{ name: "Detail", options, bounds: [destination] },
			],
			openPath: ["Detail"],
			closedPath: ["Home", "List"],
			closedRest: card,
			openRest: hero,
			tapAt: centerOf(card),
		},
	};
	const scenarios: Scenario[] = [];
	for (const [recipe, interpolator] of Object.entries(recipes)) {
		const options = {
			gestureEnabled: true,
			gestureDirection: ["vertical", "pinch-in"],
			transitionSpec: { open: spec, close: spec },
			screenStyleInterpolator: interpolator,
		};
		for (const [topology, t] of Object.entries(topologies)) {
			// `open`: the destination it was opened to (scrolled while open), or a fresh one (re-pushed).
			const add = (sequence: string, steps: Step[], open: false | "scrolled" | "fresh") =>
				scenarios.push({
					name: `handoff-${recipe} / ${topology} / ${sequence}`,
					// Without react-native-teleport, handoff renders inline by design: nothing to hand off.
					environments: ["teleport"],
					screens: t.screens(options),
					steps: [...(t.before ?? []), ...steps],
					expect: {
						mayOvershoot: true,
						stillScreens: true,
						payloadRest: { "payload-card": open === "scrolled" ? t.openRest : open === "fresh" ? hero : t.closedRest },
					},
				});
			const tap: Step = { op: "tap", at: t.tapAt };
			// Re-opening while a close runs: the closing screen may cover the card, so push directly.
			const reopen: Step = { op: "push", name: "Detail" };
			const opened: Step[] = [tap, { op: "settle" }, { op: "expectPath", names: t.openPath }, ...(t.whileOpen ?? [])];
			add("open", opened, "scrolled");
			add("open-close", [...opened, { op: "pop" }, { op: "settle" }, { op: "expectPath", names: t.closedPath }], false);
			add("pop-mid-open", [tap, { op: "frames", count: 6 }, { op: "pop" }, { op: "settle" }, { op: "expectPath", names: t.closedPath }], false);
			add(
				"open-pop-open",
				[...opened, { op: "pop" }, { op: "frames", count: 4 }, reopen, { op: "settle" }, { op: "expectPath", names: t.openPath }],
				"fresh",
			);
			add(
				"swipe-dismiss",
				[
					...opened,
					...(t.beforeDismiss ?? []),
					{ op: "swipe", direction: "vertical", distance: 0.5, durationMs: 250 },
					{ op: "settle" },
					{ op: "expectPath", names: t.closedPath },
				],
				false,
			);
			// Spam: open and close every two frames, five times, then let it land closed.
			const spam: Step[] = [];
			for (let i = 0; i < 5; i++) spam.push(i ? reopen : tap, { op: "frames", count: 2 }, { op: "pop" }, { op: "frames", count: 2 });
			add("spam", [...spam, { op: "settle" }, { op: "expectPath", names: t.closedPath }], false);
		}
	}
	// Chain: the slot can hand off again. List's card -> Detail's slot -> Theater's slot (another size
	// and shape) and back down, with spam across both hops.
	const theater = { x: W * 0.1, y: H * 0.55, width: W * 0.8, height: H * 0.22 };
	for (const [recipe, interpolator] of Object.entries(recipes)) {
		const options = {
			gestureEnabled: true,
			gestureDirection: "vertical",
			transitionSpec: { open: spec, close: spec },
			screenStyleInterpolator: interpolator,
		};
		const screens: ScreenSpec[] = [
			{ name: "List", bounds: [source("Detail")] },
			{ name: "Detail", options, bounds: [{ ...destination, pushTo: "Theater" }] },
			{ name: "Theater", options, bounds: [{ id: "card", rect: theater, handoff: true }] },
		];
		const rest = { List: card, Detail: hero, Theater: theater };
		const add = (sequence: string, steps: Step[], at: keyof typeof rest) =>
			scenarios.push({
				name: `handoff-${recipe} / chain / ${sequence}`,
				environments: ["teleport"],
				screens,
				steps,
				expect: { mayOvershoot: true, stillScreens: true, payloadRest: { "payload-card": rest[at] } },
			});
		const openFirst: Step = { op: "tap", at: centerOf(card) };
		const openSecond: Step = { op: "tap", at: centerOf(hero) };
		const both: Step[] = [openFirst, { op: "settle" }, openSecond, { op: "settle" }, { op: "expectPath", names: ["Theater"] }];
		add("open-both", both, "Theater");
		add("back-one", [...both, { op: "pop" }, { op: "settle" }, { op: "expectPath", names: ["Detail"] }], "Detail");
		add("back-both", [...both, { op: "pop" }, { op: "settle" }, { op: "pop" }, { op: "settle" }, { op: "expectPath", names: ["List"] }], "List");
		add("pop-pop-quickly", [...both, { op: "pop" }, { op: "frames", count: 3 }, { op: "pop" }, { op: "settle" }, { op: "expectPath", names: ["List"] }], "List");
		add(
			"reopen-second",
			[...both, { op: "pop" }, { op: "frames", count: 4 }, { op: "push", name: "Theater" }, { op: "settle" }, { op: "expectPath", names: ["Theater"] }],
			"Theater",
		);
		const spam: Step[] = [openFirst, { op: "settle" }];
		for (let i = 0; i < 4; i++)
			spam.push({ op: "push", name: "Theater" }, { op: "frames", count: 2 }, { op: "pop" }, { op: "frames", count: 2 });
		add("spam-second", [...spam, { op: "settle" }, { op: "expectPath", names: ["Detail"] }], "Detail");
		// Gestures down the chain: dismissing Theater, then Detail while Theater still closes, the
		// payload following each drag and landing on the card.
		const swipe = (distance = 0.5, extra: Partial<Extract<Step, { op: "swipe" }>> = {}): Step => ({
			op: "swipe",
			direction: "vertical",
			distance,
			durationMs: 250,
			...extra,
		});
		add("swipe-back-both", [...both, swipe(), { op: "settle" }, swipe(), { op: "settle" }, { op: "expectPath", names: ["List"] }], "List");
		add("swipe-swipe-quickly", [...both, swipe(), { op: "frames", count: 3 }, swipe(), { op: "settle" }, { op: "expectPath", names: ["List"] }], "List");
		add(
			"swipe-spam",
			[...both, swipe(0.4, { durationMs: 120 }), { op: "frames", count: 1 }, swipe(0.4, { durationMs: 120 }), { op: "frames", count: 1 }, swipe(0.4, { durationMs: 120 }), { op: "settle" }, { op: "expectPath", names: ["List"] }],
			"List",
		);
		add(
			"swipe-cancel-then-dismiss",
			[...both, swipe(0.1, { durationMs: 300, holdMs: 200 }), { op: "frames", count: 3 }, swipe(), { op: "settle" }, { op: "expectPath", names: ["Detail"] }],
			"Detail",
		);
	}
	return scenarios;
};

export const buildFullCatalog = (
	presets: Presets,
	interpolate: InterpolateFn,
	window: { width: number; height: number },
	overlay?: unknown,
	specs?: { Zoom?: unknown },
) => [
	...buildCatalog(presets, interpolate),
	...buildSheetCatalog(interpolate, window),
	...buildBackdropCatalog(interpolate, window),
	...buildOwnershipCatalog(interpolate, window),
	...buildGestureOptionCatalog(interpolate),
	...buildInactiveCatalog(interpolate),
	...buildSlotCatalog(interpolate, overlay),
	...buildStackProgressCatalog(interpolate),
	...buildScrollCatalog(interpolate, window),
	...buildBoundsCatalog(interpolate, window, specs ?? {}),
	...buildScrollBoundsCatalog(window, specs ?? {}),
	...buildBoundsChainCatalog(window, specs ?? {}),
	...buildGlobalBoundsCatalog(window, specs ?? {}),
	...buildHandoffCatalog(window, specs ?? {}),
];
