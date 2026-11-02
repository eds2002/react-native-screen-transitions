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

const scaleFade: TransitionFactory = (interpolate) => ({
	dismiss: "vertical",
	options: {
		gestureEnabled: true,
		gestureDirection: "vertical",
		transitionSpec: { open: DEFAULT_SPEC, close: DEFAULT_SPEC },
		screenStyleInterpolator: ({ progress }: any) => {
			"worklet";
			return {
				content: {
					style: {
						opacity: interpolate(progress, [0, 1, 2], [0, 1, 0.6], "clamp"),
						transform: [{ scale: interpolate(progress, [0, 1, 2], [0.85, 1, 0.94], "clamp") }],
					},
				},
			};
		},
	},
});

export const transitions = (presets: Presets): Record<string, TransitionFactory> => ({
	"slide-horizontal": slide("horizontal"),
	"slide-horizontal-inverted": slide("horizontal-inverted"),
	"slide-vertical": slide("vertical"),
	"slide-vertical-inverted": slide("vertical-inverted"),
	"scale-fade": scaleFade,
	"preset-slide-from-top": () => ({ options: presets.SlideFromTop(), dismiss: "vertical-inverted" }),
	"preset-slide-from-bottom": () => ({ options: presets.SlideFromBottom(), dismiss: "vertical" }),
	"preset-zoom-in": () => ({ options: presets.ZoomIn(), dismiss: null }),
	"preset-draggable-card": () => ({ options: presets.DraggableCard(), dismiss: "horizontal" }),
	"preset-elastic-card": () => ({ options: presets.ElasticCard(), dismiss: "horizontal" }),
});

export const specs: Record<string, { spec?: Record<string, unknown> | null; mayOvershoot?: boolean; instant?: boolean }> = {
	"preset-spec": {},
	timing: { spec: { duration: 350 } },
	bouncy: { spec: { stiffness: 400, damping: 18, mass: 1 }, mayOvershoot: true },
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
				scenarios.push({
					name: `${transitionName} / ${specName} / ${sequenceName}`,
					screens: [{ name: "A" }, { name: "B" }, { name: "C" }],
					screenOptions,
					steps,
					expect: { mayOvershoot, instant },
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
	"sheet-top": { edge: "top", snapPoints: [0.5, 1], initialSnapIndex: 0 },
	"sheet-right": { edge: "right", snapPoints: [0.5, 1], initialSnapIndex: 0 },
	"sheet-left": { edge: "left", snapPoints: [0.5, 1], initialSnapIndex: 0 },
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

export const buildFullCatalog = (
	presets: Presets,
	interpolate: InterpolateFn,
	window: { width: number; height: number },
	overlay?: unknown,
) => [
	...buildCatalog(presets, interpolate),
	...buildSheetCatalog(interpolate, window),
	...buildBackdropCatalog(interpolate, window),
	...buildOwnershipCatalog(interpolate, window),
	...buildGestureOptionCatalog(interpolate),
	...buildInactiveCatalog(interpolate),
	...buildSlotCatalog(interpolate, overlay),
	...buildStackProgressCatalog(interpolate),
];
