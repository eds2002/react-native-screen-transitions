/**
 * The generated scenario space: every transition × spec × step sequence that
 * makes sense together. A handful of building blocks cover what the e2e app's
 * examples exercise one by one.
 */
import type { Scenario, Step, SwipeDirection } from "./scenario";

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
