/**
 * Installs the harness's module stand-ins for one test file: the frame-accurate
 * Reanimated/Worklets sim, plus stubs for native-only modules the real stack
 * imports. Call it at the top of a harness test, before importing library code.
 */
import { mock } from "bun:test";
import * as React from "react";
import { createReanimatedSim } from "./reanimated-sim";

export const WINDOW = { width: 390, height: 844 };
export const INSETS = { top: 47, right: 0, bottom: 34, left: 0 };

const passthrough = ({ children }: { children?: React.ReactNode }) =>
	(children ?? null) as React.ReactElement | null;

/** The environment a harness file runs in: platform, window, insets and display rate. */
export const PLATFORM = { os: "ios" as "ios" | "android" };

/** Host element types the teleport stand-in renders; the recorder re-parents a portal's content into its host. */
export const TELEPORT_PORTAL = "TeleportPortal";
export const TELEPORT_HOST = "TeleportHost";

let hostViewIds = 0;
/**
 * A host view stamped with a stable id: measure() resolves a ref through it (test-renderer refs are
 * fresh node mocks, so identity can't find the view; views without a testID, like the escape
 * placeholder or an overlay host, still measure).
 */
const stampedHost = (type: string) =>
	React.forwardRef((props: Record<string, unknown>, ref) => {
		const id = React.useRef(0);
		if (!id.current) id.current = ++hostViewIds;
		return React.createElement(type, { ...props, ref, __harnessHostId: id.current });
	});

export const installHarness = ({
	frameMs,
	os = "ios",
	window,
	insets,
	teleport = false,
}: {
	frameMs?: number;
	os?: "ios" | "android";
	window?: { width: number; height: number };
	insets?: typeof INSETS;
	/** Install a react-native-teleport stand-in: boundaries escape clipping and hand off, as in apps that have it. */
	teleport?: boolean;
} = {}) => {
	// Mutated in place: every module that imported WINDOW/INSETS sees this file's values.
	if (window) Object.assign(WINDOW, window);
	if (insets) Object.assign(INSETS, insets);
	PLATFORM.os = os;
	const sim = createReanimatedSim({ frameMs });
	const StampedView = stampedHost("View");
	const StampedAnimatedView = stampedHost("AnimatedView");
	(sim.reanimated.default as Record<string, unknown>).View = StampedAnimatedView;
	// React Native's development flag (Metro defines it).
	(globalThis as { __DEV__?: boolean }).__DEV__ = true;
	globalThis.requestAnimationFrame = sim.requestAnimationFrame as typeof requestAnimationFrame;
	mock.module("react-native-reanimated", () => sim.reanimated);
	mock.module("react-native-worklets", () => sim.worklets);
	// test/setup.ts swaps the library's timing animation for the instant withTiming mock; the
	// harness steps frames, so it runs the real one.
	mock.module("../../utils/animation/timing/index.ts", () => require("../../utils/animation/timing/timing.ts"));
	// What the library imports from react-native, as host components the trace
	// recorder can read.
	mock.module("react-native", () => {
		const flatten = (style: unknown): Record<string, unknown> =>
			Array.isArray(style)
				? Object.assign({}, ...style.map(flatten))
				: style && typeof style === "object"
					? (style as Record<string, unknown>)
					: {};
		return {
			View: StampedView,
			Text: "Text",
			Pressable: "Pressable",
			ScrollView: "ScrollView",
			FlatList: "FlatList",
			I18nManager: { isRTL: false, getConstants: () => ({ isRTL: false }) },
			NativeComponentRegistry: { get: (name: string) => name },
			Platform: {
				OS: PLATFORM.os,
				select: <T>(obj: { ios?: T; android?: T; default?: T }) => obj[PLATFORM.os] ?? obj.default,
			},
			useWindowDimensions: () => ({ ...WINDOW, scale: 3, fontScale: 1 }),
			Dimensions: { get: () => ({ ...WINDOW, scale: 3, fontScale: 1 }) },
			StyleSheet: {
				absoluteFill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
				absoluteFillObject: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
				hairlineWidth: 1 / 3,
				create: <T>(styles: T) => styles,
				flatten,
			},
		};
	});
	// Gestures keep every handler and setting the library gives them; detectors
	// render as host elements holding their gesture, so a driver can find them.
	mock.module("react-native-gesture-handler", () => {
		const createGesture = (type: string) => {
			const config: Record<string, unknown> = { type, enabled: true };
			const gesture: Record<string, unknown> = { config, type };
			const proxy: Record<string, unknown> = new Proxy(gesture, {
				get(target, key) {
					if (key in target) return target[key as string];
					if (typeof key !== "string" || key === "then") return undefined;
					return (...args: unknown[]) => {
						const accumulates =
							/^(requireExternalGestureToFail|simultaneousWithExternalGesture|blocksExternalGesture)$/.test(key);
						config[key] = accumulates
							? [...((config[key] as unknown[] | undefined) ?? []), ...args]
							: args.length > 1
								? args
								: args[0];
						return proxy;
					};
				},
			});
			return proxy;
		};
		const make = (type: string) => () => createGesture(type);
		const compose = (type: string) => (...gestures: unknown[]) => ({ type, gestures, config: { type } });
		return {
			GestureHandlerRootView: passthrough,
			GestureDetector: ({ gesture, children }: { gesture: unknown; children?: React.ReactNode }) =>
				React.createElement("GestureDetector", { gesture }, children),
			Pressable: "Pressable",
			Gesture: {
				Pan: make("pan"),
				Pinch: make("pinch"),
				Native: make("native"),
				Tap: make("tap"),
				Simultaneous: compose("simultaneous"),
				Race: compose("race"),
				Exclusive: compose("exclusive"),
			},
			State: { UNDETERMINED: 0, FAILED: 1, BEGAN: 2, CANCELLED: 3, ACTIVE: 4, END: 5 },
		};
	});
	// Optional peer. Absent, handoff and escapeClipping render inline (Expo Go). The stand-in renders a
	// portal and a host as host elements; the recorder places a portal's content inside the host its
	// hostName (an animated prop, resolved per frame) names, as the native view is re-parented.
	mock.module("react-native-teleport", () =>
		teleport
			? {
					PortalProvider: passthrough,
					Portal: ({ children, ...props }: { children?: React.ReactNode }) =>
						React.createElement(TELEPORT_PORTAL, props, children),
					PortalHost: ({ children, ...props }: { children?: React.ReactNode }) =>
						React.createElement(TELEPORT_HOST, props, children),
				}
			: {},
	);
	mock.module("react-native-safe-area-context", () => {
		const SafeAreaInsetsContext = React.createContext(INSETS);
		const SafeAreaFrameContext = React.createContext({ x: 0, y: 0, ...WINDOW });
		return {
			SafeAreaProvider: passthrough,
			SafeAreaView: passthrough,
			SafeAreaInsetsContext,
			SafeAreaFrameContext,
			initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, ...WINDOW } },
			useSafeAreaInsets: () => INSETS,
			useSafeAreaFrame: () => ({ x: 0, y: 0, ...WINDOW }),
		};
	});
	return sim;
};
