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
	"swipe-during-snap": (v) => [
		{ op: "push", name: "S" },
		{ op: "settle" },
		{ op: "snapTo", index: v.snapPoints.length - 1 },
		{ op: "frames", count: 4 },
		{ op: "swipe", direction: SHEET_DISMISS[v.edge], distance: 0.6, durationMs: 200 },
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

const ABOVE_SHEET = { x: 195, y: 120 };
const ON_SHEET = { x: 195, y: 780 };

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
		{ op: "swipe", direction: "vertical", distance: 0.3, durationMs: 250 },
	],
};

export const buildBackdropCatalog = (interpolate: InterpolateFn, window: { width: number; height: number }): Scenario[] => {
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

export const buildFullCatalog = (presets: Presets, interpolate: InterpolateFn, window: { width: number; height: number }) => [
	...buildCatalog(presets, interpolate),
	...buildSheetCatalog(interpolate, window),
	...buildBackdropCatalog(interpolate, window),
	...buildOwnershipCatalog(interpolate, window),
];
