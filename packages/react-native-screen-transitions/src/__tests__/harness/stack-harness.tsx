/**
 * Mounts the real BlankStack (React Navigation integration) under the
 * Reanimated sim and records, frame by frame, what each screen looks like:
 * its rectangle in window coordinates (every ancestor's transform composed),
 * its opacity (ancestors multiplied) and whether it takes touches.
 *
 * The recorder only reads host views, so it does not depend on how the
 * library layers a screen. Assumption: the layers a screen's transforms sit on
 * fill the window (true of the screen container, gate, content and surface
 * layers), so every transform is applied around the window's center.
 */
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";
import { createGestureDriver } from "./gesture-driver";
import { INSETS, WINDOW } from "./install";
import type { ReanimatedSim } from "./reanimated-sim";

export type Rect = { x: number; y: number; width: number; height: number };

export type SceneFrame = {
	key: string;
	name: string;
	/** The screen's box in window coordinates. */
	rect: Rect;
	/** Ancestors' opacity multiplied. */
	opacity: number;
	/** False when the screen or an ancestor has pointerEvents "none". */
	touchable: boolean;
	/** A 3D operation (perspective, rotateX/Y) was approximated as 2D. */
	approx3d: boolean;
	/** Per host layer on the way down: its resolved style and props, for debugging and goldens. */
	layers: Array<{ type: string; style: Record<string, unknown>; pointerEvents?: unknown }>;
};

export type TraceFrame = { frame: number; time: number; scenes: SceneFrame[]; label?: string };

type Affine = { a: number; b: number; c: number; d: number; tx: number; ty: number };

const IDENTITY: Affine = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };

const multiply = (m: Affine, n: Affine): Affine => ({
	a: m.a * n.a + m.c * n.b,
	b: m.b * n.a + m.d * n.b,
	c: m.a * n.c + m.c * n.d,
	d: m.b * n.c + m.d * n.d,
	tx: m.a * n.tx + m.c * n.ty + m.tx,
	ty: m.b * n.tx + m.d * n.ty + m.ty,
});

const toRadians = (value: unknown): number => {
	if (typeof value === "number") return value;
	if (typeof value !== "string") return 0;
	if (value.endsWith("deg")) return (Number.parseFloat(value) * Math.PI) / 180;
	if (value.endsWith("rad")) return Number.parseFloat(value);
	return Number.parseFloat(value) || 0;
};

const toLength = (value: unknown, size: number): number => {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.endsWith("%")) return (Number.parseFloat(value) / 100) * size;
	return Number(value) || 0;
};

/** One RN transform list as an affine matrix about the window center, plus whether it was 3D. */
const transformMatrix = (transform: unknown): { matrix: Affine; approx3d: boolean } => {
	let matrix = IDENTITY;
	let approx3d = false;
	if (!Array.isArray(transform)) return { matrix, approx3d };
	for (const op of transform) {
		if (!op || typeof op !== "object") continue;
		const [key, value] = Object.entries(op)[0] ?? [];
		let step: Affine | null = null;
		switch (key) {
			case "translateX":
				step = { ...IDENTITY, tx: toLength(value, WINDOW.width) };
				break;
			case "translateY":
				step = { ...IDENTITY, ty: toLength(value, WINDOW.height) };
				break;
			case "scale":
				step = { ...IDENTITY, a: Number(value), d: Number(value) };
				break;
			case "scaleX":
				step = { ...IDENTITY, a: Number(value) };
				break;
			case "scaleY":
				step = { ...IDENTITY, d: Number(value) };
				break;
			case "rotate":
			case "rotateZ": {
				const r = toRadians(value);
				step = { a: Math.cos(r), b: Math.sin(r), c: -Math.sin(r), d: Math.cos(r), tx: 0, ty: 0 };
				break;
			}
			case "skewX":
				step = { ...IDENTITY, c: Math.tan(toRadians(value)) };
				break;
			case "skewY":
				step = { ...IDENTITY, b: Math.tan(toRadians(value)) };
				break;
			case "matrix": {
				const m = value as number[];
				if (m.length === 16) step = { a: m[0], b: m[1], c: m[4], d: m[5], tx: m[12], ty: m[13] };
				else if (m.length === 9) step = { a: m[0], b: m[1], c: m[3], d: m[4], tx: m[6], ty: m[7] };
				approx3d = true;
				break;
			}
			case "perspective":
			case "rotateX":
			case "rotateY":
				approx3d = true;
				break;
		}
		if (step) matrix = multiply(matrix, step);
	}
	return { matrix, approx3d };
};

const flattenStyle = (style: unknown): Record<string, unknown> => {
	if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyle));
	if (style && typeof style === "object") return style as Record<string, unknown>;
	return {};
};

const pathTo = (node: ReactTestInstance): ReactTestInstance[] => {
	const path: ReactTestInstance[] = [];
	let current: ReactTestInstance | null = node;
	while (current) {
		path.unshift(current);
		current = current.parent;
	}
	return path;
};

export const SCREEN_MARKER = "harness-screen:";

/** A host node's box in window coordinates (layers assumed to fill the window), and its pointerEvents. */
export const nodeBox = (node: ReactTestInstance, sim: ReanimatedSim) => {
	let matrix = IDENTITY;
	for (const step of pathTo(node)) {
		if (typeof step.type !== "string") continue;
		const style = flattenStyle(sim.resolveAnimated(step.props.style));
		const { matrix: local } = transformMatrix(style.transform);
		const cx = WINDOW.width / 2;
		const cy = WINDOW.height / 2;
		matrix = multiply(matrix, multiply(multiply({ ...IDENTITY, tx: cx, ty: cy }, local), { ...IDENTITY, tx: -cx, ty: -cy }));
	}
	const corners = [
		[0, 0],
		[WINDOW.width, 0],
		[0, WINDOW.height],
		[WINDOW.width, WINDOW.height],
	].map(([x, y]) => [matrix.a * x + matrix.c * y + matrix.tx, matrix.b * x + matrix.d * y + matrix.ty]);
	const xs = corners.map((p) => p[0]);
	const ys = corners.map((p) => p[1]);
	return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
};

const pointerEventsOf = (node: ReactTestInstance, sim: ReanimatedSim) =>
	(flattenStyle(sim.resolveAnimated(node.props.animatedProps)).pointerEvents ?? node.props.pointerEvents ?? "auto") as string;

/**
 * React Native's touch target for a point: the topmost, deepest host view
 * under it that takes touches (pointerEvents "none" skips a subtree,
 * "box-none" skips the view itself, "box-only" skips its children).
 */
export const hitTest = (root: ReactTestInstance, point: { x: number; y: number }, sim: ReanimatedSim) => {
	const inside = (node: ReactTestInstance) => {
		const box = nodeBox(node, sim);
		return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
	};
	const visit = (node: ReactTestInstance): ReactTestInstance | null => {
		const host = typeof node.type === "string";
		// display: contents has no box of its own: never a target, its children can be.
		const contents = host && flattenStyle(sim.resolveAnimated(node.props.style)).display === "contents";
		const pe = host && !contents ? pointerEventsOf(node, sim) : contents ? "box-none" : "box-none";
		if (pe === "none") return null;
		if (pe !== "box-only") {
			const children = node.children.filter((c): c is ReactTestInstance => typeof c !== "string");
			for (let i = children.length - 1; i >= 0; i--) {
				const hit = visit(children[i]);
				if (hit) return hit;
			}
		}
		if (host && pe !== "box-none" && node.type !== "GestureDetector" && inside(node)) return node;
		return null;
	};
	return visit(root);
};

/** Reads every marked screen's visual state from the rendered host tree. */
export const readScenes = (renderer: ReactTestRenderer, sim: ReanimatedSim): SceneFrame[] => {
	// Nothing rendered at all (the whole tree unmounted): no screens.
	let root: ReactTestInstance;
	try {
		root = renderer.root;
	} catch {
		return [];
	}
	const markers = root.findAll(
		(node) => typeof node.props.testID === "string" && node.props.testID.startsWith(SCREEN_MARKER),
		{ deep: true },
	);
	const scenes: SceneFrame[] = [];
	for (const marker of markers) {
		if (typeof marker.type !== "string") continue;
		const [, key, name] = (marker.props.testID as string).split(":");
		// About the window center: translate to the center, apply, translate back.
		let matrix = IDENTITY;
		let opacity = 1;
		let touchable = true;
		let approx3d = false;
		const layers: SceneFrame["layers"] = [];
		for (const node of pathTo(marker)) {
			if (typeof node.type !== "string") continue;
			const style = flattenStyle(sim.resolveAnimated(node.props.style));
			const animatedProps = flattenStyle(sim.resolveAnimated(node.props.animatedProps));
			const pointerEvents = animatedProps.pointerEvents ?? node.props.pointerEvents;
			if (pointerEvents === "none") touchable = false;
			if (style.display === "none") opacity = 0;
			if (typeof style.opacity === "number") opacity *= style.opacity;
			const { matrix: local, approx3d: was3d } = transformMatrix(style.transform);
			approx3d ||= was3d;
			const cx = WINDOW.width / 2;
			const cy = WINDOW.height / 2;
			const centered = multiply(multiply({ ...IDENTITY, tx: cx, ty: cy }, local), { ...IDENTITY, tx: -cx, ty: -cy });
			matrix = multiply(matrix, centered);
			if (style.transform || style.opacity !== undefined || pointerEvents !== undefined) {
				layers.push({ type: node.type, style, pointerEvents });
			}
		}
		const corners = [
			[0, 0],
			[WINDOW.width, 0],
			[0, WINDOW.height],
			[WINDOW.width, WINDOW.height],
		].map(([x, y]) => [matrix.a * x + matrix.c * y + matrix.tx, matrix.b * x + matrix.d * y + matrix.ty]);
		const xs = corners.map((p) => p[0]);
		const ys = corners.map((p) => p[1]);
		scenes.push({
			key,
			name,
			rect: {
				x: Math.min(...xs),
				y: Math.min(...ys),
				width: Math.max(...xs) - Math.min(...xs),
				height: Math.max(...ys) - Math.min(...ys),
			},
			opacity,
			touchable,
			approx3d,
			layers,
		});
	}
	return scenes;
};

export type ScreenSpec = {
	name: string;
	options?: Record<string, unknown>;
	/** Makes this screen a nested BlankStack with these screens (the first is its initial route). */
	stack?: { screens: ScreenSpec[]; screenOptions?: Record<string, unknown> };
};

type NavState = { index: number; routes: Array<{ key: string; name: string; state?: NavState }> };

/** Every leaf route (a route that is not itself a stack), with the focused leaf last. */
export const leafRoutes = (state: NavState | undefined) => {
	const leaves: Array<{ key: string; name: string }> = [];
	let focused: { key: string; name: string } | undefined;
	const walk = (s: NavState, onFocusedPath: boolean) => {
		s.routes.forEach((route, i) => {
			const focusedHere = onFocusedPath && i === s.index;
			if (route.state) walk(route.state, focusedHere);
			else {
				leaves.push({ key: route.key, name: route.name });
				if (focusedHere) focused = { key: route.key, name: route.name };
			}
		});
	};
	if (state) walk(state, true);
	return focused ? [...leaves.filter((l) => l.key !== focused?.key), focused] : leaves;
};

/** Route names from the root to the focused leaf. */
export const focusedPath = (state: NavState | undefined) => {
	const path: string[] = [];
	let current = state;
	while (current) {
		const route = current.routes[current.index];
		path.push(route.name);
		current = route.state;
	}
	return path;
};

export type StackHarness = Awaited<ReturnType<typeof mountStack>>;

/**
 * Mounts a BlankStack with the given screens. Each screen renders a marker the
 * recorder finds (`harness-screen:<routeKey>:<name>`).
 */
export const mountStack = async (
	sim: ReanimatedSim,
	{ screens, screenOptions }: { screens: ScreenSpec[]; screenOptions?: Record<string, unknown> },
) => {
	const React = await import("react");
	const { act, create } = await import("react-test-renderer");
	const { BaseNavigationContainer, createNavigationContainerRef } = await import("@react-navigation/core");
	const { LinkingContext } = await import("@react-navigation/native");
	const { createBlankStackNavigator } = await import("../../navigators/react-navigation");
	const ref = createNavigationContainerRef<Record<string, object | undefined>>();
	const trace: TraceFrame[] = [];

	const taps: Record<string, number> = {};
	// Each screen is one pressable surface counting its taps, around the marker the recorder reads.
	const Screen = ({ route }: { route: { key: string; name: string } }) =>
		React.createElement(
			"Pressable",
			{
				testID: `harness-tap:${route.key}`,
				onPress: () => {
					taps[route.name] = (taps[route.name] ?? 0) + 1;
				},
			},
			React.createElement("View", { testID: `${SCREEN_MARKER}${route.key}:${route.name}` }),
		);

	/** One BlankStack with these screens; nested specs become nested stacks. */
	const buildNavigator = (specs: ScreenSpec[], navigatorOptions?: Record<string, unknown>) => {
		const Stack = createBlankStackNavigator();
		const children = specs.map((spec) => {
			const component = spec.stack
				? (() => {
						const Nested = buildNavigator(spec.stack.screens, spec.stack.screenOptions);
						return () => Nested;
					})()
				: Screen;
			return React.createElement(Stack.Screen as never, {
				key: spec.name,
				name: spec.name,
				component,
				options: spec.options,
			} as never);
		});
		return React.createElement(Stack.Navigator as never, { screenOptions: navigatorOptions } as never, ...children);
	};

	let renderer: ReactTestRenderer | undefined;
	await act(async () => {
		renderer = create(
			React.createElement(
				LinkingContext.Provider,
				{ value: { options: undefined } } as never,
				React.createElement(
					BaseNavigationContainer,
					{ ref } as never,
					buildNavigator(screens, screenOptions),
				),
			),
		);
	});
	const root = renderer as ReactTestRenderer;

	const record = (label?: string) => {
		const frame = { frame: sim.clock.frame, time: sim.clock.now, scenes: readScenes(root, sim), label };
		trace.push(frame);
		return frame;
	};

	/** One UI frame (after `beforeFrame`, UI-thread work such as touch events), then the JS work it scheduled, then a recorded frame. */
	const frame = async (label?: string, beforeFrame?: () => void) => {
		await act(async () => {
			beforeFrame?.();
			sim.frame();
			// JS work can schedule more UI work and vice versa; drain both hops.
			for (let i = 0; i < 5 && sim.flushRN() > 0; i++) sim.runReactions();
		});
		return record(label);
	};

	const frames = async (count: number) => {
		for (let i = 0; i < count; i++) await frame();
	};

	/** Runs frames until nothing animates or waits (plus a couple of quiet frames), up to `limit`. */
	const settle = async (limit = 600) => {
		let quiet = 0;
		for (let i = 0; i < limit; i++) {
			await frame();
			quiet = sim.isIdle() ? quiet + 1 : 0;
			if (quiet >= 3) return;
		}
		throw new Error(`did not settle within ${limit} frames (running ${sim.runningCount()})`);
	};

	/** Runs a navigation action on the JS thread (between frames), like a press handler. */
	const js = async (action: () => void) => {
		await act(async () => {
			action();
		});
	};

	const gestures = createGestureDriver({
		renderer: root,
		scenes: () => readScenes(root, sim),
		frameWith: (beforeFrame) => frame(undefined, beforeFrame),
		frameMs: sim.clock.frameMs,
	});

	/** A tap: the touched view's nearest onPress runs (between frames, on the JS thread). Returns what it hit. */
	const tap = async (point: { x: number; y: number }) => {
		const hit = hitTest(root.root, point, sim);
		let handler: ReactTestInstance | null = hit;
		while (handler && typeof handler.props.onPress !== "function") handler = handler.parent;
		await js(() => {
			(handler?.props.onPress as ((e: unknown) => void) | undefined)?.({ nativeEvent: { locationX: point.x, locationY: point.y } });
		});
		return { hit: hit ? `${String(hit.type)}${hit.props.testID ? `#${hit.props.testID}` : ""}` : null, handled: !!handler };
	};

	return {
		ref,
		trace,
		gestures,
		tap,
		taps,
		renderer: root,
		frame,
		frames,
		settle,
		js,
		record,
		navigate: (name: string, params?: object) => js(() => ref.navigate(name as never, params as never)),
		push: (name: string, params?: object) =>
			js(() => ref.dispatch({ type: "PUSH", payload: { name, params } } as never)),
		goBack: () => js(() => ref.goBack()),
		/** Pushes `name` onto the nested stack at `path` (route names from the root's routes down). */
		pushIn: (path: string[], name: string, params?: object) =>
			js(() => {
				let state = ref.getRootState() as unknown as (NavState & { key: string }) | undefined;
				for (const segment of path) {
					const route = state?.routes.find((r) => r.name === segment);
					state = route?.state as (NavState & { key: string }) | undefined;
				}
				if (!state) throw new Error(`no nested stack at ${path.join("/")}`);
				ref.dispatch({ type: "PUSH", payload: { name, params }, target: state.key } as never);
			}),
		replace: (name: string, params?: object) =>
			js(() => ref.dispatch({ type: "REPLACE", payload: { name, params } } as never)),
		routes: () => ref.getRootState()?.routes.map((r) => ({ key: r.key, name: r.name })) ?? [],
		/** Leaf routes across nested stacks, focused leaf last. */
		leafRoutes: () => leafRoutes(ref.getRootState() as unknown as NavState),
		focusedPath: () => focusedPath(ref.getRootState() as unknown as NavState),
		unmount: () => act(async () => root.unmount()),
		window: WINDOW,
		insets: INSETS,
	};
};
