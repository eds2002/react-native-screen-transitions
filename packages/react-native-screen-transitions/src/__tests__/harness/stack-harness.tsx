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
import { INSETS, TELEPORT_HOST, TELEPORT_PORTAL, WINDOW } from "./install";
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
	/** The screen's styleId elements: composed pose and their own resolved style. */
	elements: Record<string, { rect: Rect; opacity: number; style: Record<string, unknown> }>;
};

export type OverlayFrame = { owner: string; focused: string; rect: Rect; opacity: number };

export type TraceFrame = { frame: number; time: number; scenes: SceneFrame[]; overlays: OverlayFrame[]; label?: string };

export const ELEMENT_MARKER = "harness-el:";
export const BOUND_MARKER = "harness-bound:";

/**
 * A view's on-screen box: its layout rect (the nearest ancestor-or-self with an
 * explicit left/top/width/height, else the window), through its own and its
 * descendants' transforms about that rect's center, and through the layers
 * above it (which fill the window) about the window's center.
 */
/** A view placed at its own rect (left/top + width/height), like a boundary or a nested scroll view. */
const hasOwnLayout = (st: Record<string, unknown>) =>
	typeof st.width === "number" && typeof st.height === "number" && (typeof st.left === "number" || typeof st.top === "number");

export const elementBox = (node: ReactTestInstance, sim: ReanimatedSim, { layoutOnly = false } = {}) => {
	const path = pathTo(node).filter((n) => typeof n.type === "string");
	const styles = path.map((n) => flattenStyle(layoutOnly ? staticStyle(n.props.style, sim) : sim.resolveAnimated(n.props.style)));
	let layoutIndex = -1;
	for (let i = path.length - 1; i >= 0; i--) {
		if (hasOwnLayout(styles[i])) {
			layoutIndex = i;
			break;
		}
	}
	const rect =
		layoutIndex >= 0
			? {
					x: Number(styles[layoutIndex].left ?? 0),
					y: Number(styles[layoutIndex].top ?? 0),
					width: Number(styles[layoutIndex].width),
					height: Number(styles[layoutIndex].height),
				}
			: { x: 0, y: 0, ...WINDOW };
	let matrix = IDENTITY;
	// The box the current node is laid out in, at the local origin: the window, or a positioned
	// ancestor (a scroll view nested in another one's content).
	let container = { width: WINDOW.width, height: WINDOW.height };
	path.forEach((step, i) => {
		const { matrix: local } = transformMatrix(styles[i].transform);
		const own = i >= layoutIndex && layoutIndex >= 0;
		const placed = !own && hasOwnLayout(styles[i]);
		const left = placed ? Number(styles[i].left ?? 0) : 0;
		const top = placed ? Number(styles[i].top ?? 0) : 0;
		const cx = own ? rect.x + rect.width / 2 : placed ? left + Number(styles[i].width) / 2 : container.width / 2;
		const cy = own ? rect.y + rect.height / 2 : placed ? top + Number(styles[i].height) / 2 : container.height / 2;
		matrix = multiply(matrix, multiply(multiply({ ...IDENTITY, tx: cx, ty: cy }, local), { ...IDENTITY, tx: -cx, ty: -cy }));
		if (placed) {
			matrix = multiply(matrix, { ...IDENTITY, tx: left, ty: top });
			container = { width: Number(styles[i].width), height: Number(styles[i].height) };
		}
		if (i < path.length - 1) matrix = multiply(matrix, contentShift(step));
	});
	const corners = [
		[rect.x, rect.y],
		[rect.x + rect.width, rect.y],
		[rect.x, rect.y + rect.height],
		[rect.x + rect.width, rect.y + rect.height],
	].map(([x, y]) => [matrix.a * x + matrix.c * y + matrix.tx, matrix.b * x + matrix.d * y + matrix.ty]);
	const xs = corners.map((p) => p[0]);
	const ys = corners.map((p) => p[1]);
	return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
};
/**
 * A style without its animated parts. Reanimated applies animated styles to the native view on the
 * UI thread, outside the layout React Native measures, so measure() reports a view's layout (and its
 * scroll position) without them.
 */
const staticStyle = (style: unknown, sim: ReanimatedSim): unknown => {
	if (Array.isArray(style)) return style.filter((part) => !sim.isAnimatedHandle(part)).map((part) => staticStyle(part, sim));
	return sim.isAnimatedHandle(style) ? undefined : style;
};

export const SCROLL_MARKER = "harness-scroll:";
/** Suffix of a scroll view nested inside a screen's scroll view. */
const INNER_SCROLL = ":inner";

/**
 * The current offset of a harness scroll view (by testID), set by the mounted stack. A scroll view
 * moves its content by minus its offset, so everything inside it is placed accordingly, by the
 * recorder and by measure() alike (as native measurement reports scrolled content).
 */
let scrollOffsetOf: ((testID: string) => number) | null = null;

/** The translation a host node applies to its children: a scroll view moves its content. */
const contentShift = (node: ReactTestInstance): Affine => {
	const testID = String(node.props.testID ?? "");
	if (!scrollOffsetOf || !testID.startsWith(SCROLL_MARKER)) return IDENTITY;
	const offset = scrollOffsetOf(testID);
	return node.props.horizontal ? { ...IDENTITY, tx: -offset } : { ...IDENTITY, ty: -offset };
};
export const OVERLAY_MARKER = "harness-overlay:";

/** A host node's composed opacity (its own and its ancestors'). */
const composedOpacity = (node: ReactTestInstance, sim: ReanimatedSim) => {
	let opacity = 1;
	for (const step of pathTo(node)) {
		if (typeof step.type !== "string") continue;
		const style = flattenStyle(sim.resolveAnimated(step.props.style));
		if (style.display === "none") return 0;
		if (typeof style.opacity === "number") opacity *= Math.min(1, Math.max(0, style.opacity));
	}
	return opacity;
};

/** Every overlay marker: which screen owns it, which route it shows as focused, and its pose. */
export const readOverlays = (renderer: ReactTestRenderer, sim: ReanimatedSim): OverlayFrame[] => {
	let root: ReactTestInstance;
	try {
		root = renderer.root;
	} catch {
		return [];
	}
	return root
		.findAll((node) => typeof node.type === "string" && String(node.props.testID ?? "").startsWith(OVERLAY_MARKER), { deep: true })
		.map((node) => {
			const [, owner, focused] = String(node.props.testID).split(":");
			return { owner, focused, rect: nodeBox(node, sim), opacity: composedOpacity(node, sim) };
		});
};

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

/**
 * The host a teleport portal's content is in this frame (its hostName, an animated prop, names a
 * mounted host), or null when it renders inline. Set by the mounted stack.
 */
let teleportHostOf: ((portal: ReactTestInstance) => ReactTestInstance | null) | null = null;

/**
 * A node's ancestors, root first. Content of a teleported portal sits inside its host, as the native
 * view is re-parented: its rect, opacity and measurement compose the host's ancestors, not the portal's.
 */
const pathTo = (node: ReactTestInstance): ReactTestInstance[] => {
	const path: ReactTestInstance[] = [];
	let current: ReactTestInstance | null = node;
	let fromBelow = false;
	while (current) {
		if (fromBelow && current.type === TELEPORT_PORTAL && teleportHostOf) {
			current = teleportHostOf(current) ?? current;
		}
		path.unshift(current);
		current = current.parent;
		fromBelow = true;
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
		if (step !== node) matrix = multiply(matrix, contentShift(step));
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
		// A view inside a laid-out rect (a boundary, a list item, a teleport host) is hit only inside that rect.
		const box = elementBox(node, sim);
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
			// React Native clamps opacity to [0, 1].
			if (typeof style.opacity === "number") opacity *= Math.min(1, Math.max(0, style.opacity));
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
		const elements: SceneFrame["elements"] = {};
		for (const element of marker.findAll(
			(node) =>
				typeof node.type === "string" &&
				(String(node.props.testID ?? "").startsWith(ELEMENT_MARKER) || String(node.props.testID ?? "").startsWith(BOUND_MARKER)),
			{ deep: true },
		)) {
			const bound = String(element.props.testID).startsWith(BOUND_MARKER);
			const id = `${bound ? "bound:" : ""}${String(element.props.testID).split(":").at(-1)}`;
			elements[id] = {
				// A boundary and a handoff payload fill their nearest positioned ancestor (the payload's is
				// whichever boundary holds it now).
				rect: bound || id.startsWith("payload-") ? elementBox(element, sim) : nodeBox(element, sim),
				opacity: composedOpacity(element, sim),
				style: flattenStyle(sim.resolveAnimated(element.props.style)),
			};
		}
		let rect = {
			x: Math.min(...xs),
			y: Math.min(...ys),
			width: Math.max(...xs) - Math.min(...xs),
			height: Math.max(...ys) - Math.min(...ys),
		};
		// Clipped to the innermost sized, overflow-hidden layer on the way down (zoom and reveal crop the screen).
		const clipping = pathTo(marker)
			.filter((n) => typeof n.type === "string")
			.filter((n) => {
				const st = flattenStyle(sim.resolveAnimated(n.props.style));
				return st.overflow === "hidden" && typeof st.width === "number" && typeof st.height === "number";
			})
			.at(-1);
		if (clipping) {
			const clip = elementBox(clipping, sim);
			const x1 = Math.max(rect.x, clip.x);
			const y1 = Math.max(rect.y, clip.y);
			const x2 = Math.min(rect.x + rect.width, clip.x + clip.width);
			const y2 = Math.min(rect.y + rect.height, clip.y + clip.height);
			rect = { x: x1, y: y1, width: Math.max(0, x2 - x1), height: Math.max(0, y2 - y1) };
		}
		scenes.push({
			elements,
			key,
			name,
			rect,
			opacity,
			touchable,
			approx3d,
			layers,
		});
	}
	return scenes;
};

export type BoundSpec = {
	id: string;
	rect: Rect;
	/** Pressing it pushes this route (params { id }); a nested stack without it hands the push to its parent. */
	pushTo?: string;
	/** Pressing it navigates to `name` (opening its nested `screen` with params { id }): a screen in a sibling stack. */
	navigateTo?: { name: string; screen?: string };
	group?: string;
	/** A handoff boundary: its live content moves between the matching boundaries instead of remounting. */
	handoff?: boolean;
	/**
	 * Renders a live child filling the boundary, recorded as the element `payload-<id>` of this screen
	 * wherever it is teleported (a handoff source; the destination renders none).
	 */
	payload?: boolean;
};

export type ScreenSpec = {
	name: string;
	options?: Record<string, unknown>;
	/** styleIds rendered as Transition.View elements inside the screen. */
	elements?: string[];
	/**
	 * A full-screen Transition.ScrollView with this much content (along its axis). `bounds` sit in its
	 * content (rects in content coordinates), so they move as it scrolls.
	 */
	scroll?: {
		contentSize: number;
		horizontal?: boolean;
		bounds?: BoundSpec[];
		/** A Transition.ScrollView nested in this one's content at `rect` (a carousel in a list), with its own `bounds`. */
		inner?: { rect: Rect; contentSize: number; horizontal?: boolean; bounds?: BoundSpec[] };
	};
	/** Transition.Boundary views at these window rects; pressing one pushes `pushTo` (with params { id }). */
	bounds?: BoundSpec[];
	/**
	 * Makes this screen a nested BlankStack with these screens (the first is its initial route).
	 * `independent` puts it in its own NavigationContainer (a NavigationIndependentTree): it shares no
	 * navigation state with the outer tree, and its screens reach outer routes through the navigation
	 * of the screen hosting it, as an app passes it down.
	 */
	stack?: { screens: ScreenSpec[]; screenOptions?: Record<string, unknown>; independent?: boolean };
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

type NavigationLike = {
	push: (name: string, params?: object) => void;
	navigate: (name: string, params?: object) => void;
	getState: () => { routeNames?: string[] } | undefined;
	getParent: () => NavigationLike | undefined;
};

/** Whether this navigation, or one of its parents in the same tree, has a route named `name`. */
const knowsRoute = (navigation: NavigationLike, name: string) => {
	for (let nav: NavigationLike | undefined = navigation; nav; nav = nav.getParent()) {
		if (nav.getState()?.routeNames?.includes(name)) return true;
	}
	return false;
};

type NavigatorFactory = () => { Navigator: unknown; Screen: unknown };
let navigatorFactory: NavigatorFactory | null = null;

/**
 * Mounts every stack (nested ones too) with this navigator factory instead of
 * createBlankStackNavigator: a custom navigator built on the navigator kit runs
 * the same scenarios.
 */
export const setNavigatorFactory = (factory: NavigatorFactory | null) => {
	navigatorFactory = factory;
};

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
	const { BaseNavigationContainer, NavigationIndependentTree, createNavigationContainerRef } = await import("@react-navigation/core");
	const { LinkingContext } = await import("@react-navigation/native");
	const { createBlankStackNavigator } = await import("../../navigators/react-navigation");
	const ref = createNavigationContainerRef<Record<string, object | undefined>>();
	type ContainerRef = typeof ref;
	const trace: TraceFrame[] = [];
	/** Each independent container's ref, by the key of the outer route hosting it. */
	const independentRefs = new Map<string, ContainerRef>();
	/**
	 * The whole route tree: an independent container's state is set as its hosting route's nested
	 * state, so paths and leaf routes read across containers. `owner` names the container that holds
	 * each stack state (by its key), for actions sent to it.
	 */
	const owners = new Map<string, ContainerRef>();
	const fullState = (container: ContainerRef = ref): NavState | undefined => {
		const state = container.isReady() ? (container.getRootState() as unknown as NavState & { key: string }) : undefined;
		if (!state) return undefined;
		const merge = (s: NavState & { key: string }): NavState => {
			owners.set(s.key, container);
			return {
				...s,
				routes: s.routes.map((route) => {
					if (route.state) return { ...route, state: merge(route.state as NavState & { key: string }) };
					const inner = independentRefs.get(route.key);
					const innerState = inner ? fullState(inner) : undefined;
					return innerState ? { ...route, state: innerState } : route;
				}),
			};
		};
		return merge(state);
	};
	/** The containers on the focused path, innermost first. */
	const focusedContainers = () => {
		const list: ContainerRef[] = [ref];
		let state = fullState();
		while (state) {
			const route = state.routes[state.index];
			const inner = independentRefs.get(route.key);
			if (inner) list.unshift(inner);
			state = route.state;
		}
		return list;
	};
	/** Outer screens' navigation objects, for screens in an independent tree (innermost tree first). */
	const OuterNavigation = React.createContext<NavigationLike[]>([]);

	const { default: Transition } = await import("../../index");
	const specsByName = new Map<string, ScreenSpec>();
	const collect = (list: ScreenSpec[]) => {
		for (const spec of list) {
			specsByName.set(spec.name, spec);
			if (spec.stack) collect(spec.stack.screens);
		}
	};
	collect(screens);
	const taps: Record<string, number> = {};
	/** Each mounted screen's navigation object, by route name (for setOptions). */
	const navigations: Record<string, { setOptions: (options: object) => void }> = {};
	// Each screen is one pressable surface counting its taps, around the marker the recorder reads.
	const Screen = ({ route, navigation }: { route: { key: string; name: string }; navigation: { setOptions: (o: object) => void } }) => {
		navigations[route.name] = navigation;
		const outer = React.useContext(OuterNavigation);
		// The navigation that knows `name`: this screen's own (its stack or a parent), else the outer
		// tree's, as an app hands the outer navigation into an independent container.
		const navigationFor = (name: string) =>
			[navigation as unknown as NavigationLike, ...outer].find((nav) => knowsRoute(nav, name)) ?? (navigation as unknown as NavigationLike);
		// Positioned by a wrapper, sized itself, as an app lays a card out: a boundary that escapes into its
		// overlay host takes its size there, not a position inside its old parent.
		const renderBound = (bound: BoundSpec) =>
			React.createElement(
				"View",
				{
					key: `bound-${bound.id}`,
					pointerEvents: "box-none",
					style: { position: "absolute", left: bound.rect.x, top: bound.rect.y, width: bound.rect.width, height: bound.rect.height },
				},
				React.createElement(Transition.Boundary as never, {
					id: bound.id,
					group: bound.group,
					handoff: bound.handoff,
					testID: `${BOUND_MARKER}${route.key}:${bound.id}`,
					style: { width: bound.rect.width, height: bound.rect.height },
					onPress: bound.pushTo
						? () => navigationFor(bound.pushTo as string).push(bound.pushTo as string, { id: bound.id })
						: bound.navigateTo
							? () => {
									const { name, screen } = bound.navigateTo as { name: string; screen?: string };
									navigationFor(name).navigate(
										name,
										screen ? { screen, params: { id: bound.id } } : { id: bound.id },
									);
								}
							: undefined,
				} as never,
				...(bound.payload
					? [
							// No layout of its own: it fills whichever boundary holds it, as live content would.
							React.createElement("View", {
								key: "payload",
								testID: `${ELEMENT_MARKER}${route.key}:payload-${bound.id}`,
							}),
						]
					: [])),
			);
		return React.createElement(
			"Pressable",
			{
				testID: `harness-tap:${route.key}`,
				onPress: () => {
					taps[route.name] = (taps[route.name] ?? 0) + 1;
				},
			},
			React.createElement(
				"View",
				{ testID: `${SCREEN_MARKER}${route.key}:${route.name}` },
				...(specsByName.get(route.name)?.scroll
					? [
							React.createElement(
								Transition.ScrollView as never,
								{
									key: "scroll",
									testID: `${SCROLL_MARKER}${route.key}`,
									horizontal: specsByName.get(route.name)?.scroll?.horizontal,
									style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
								} as never,
								...(specsByName.get(route.name)?.scroll?.bounds ?? []).map(renderBound),
								...(() => {
									const inner = specsByName.get(route.name)?.scroll?.inner;
									if (!inner) return [];
									return [
										React.createElement(
											Transition.ScrollView as never,
											{
												key: "inner-scroll",
												testID: `${SCROLL_MARKER}${route.key}${INNER_SCROLL}`,
												horizontal: inner.horizontal,
												style: { position: "absolute", left: inner.rect.x, top: inner.rect.y, width: inner.rect.width, height: inner.rect.height },
											} as never,
											...(inner.bounds ?? []).map(renderBound),
										),
									];
								})(),
							),
						]
					: []),
				...(specsByName.get(route.name)?.bounds ?? []).map(renderBound),
				...(specsByName.get(route.name)?.elements ?? []).map((styleId) =>
					React.createElement(Transition.View as never, {
						key: styleId,
						styleId,
						testID: `${ELEMENT_MARKER}${route.key}:${styleId}`,
					} as never),
				),
			),
		);
	};

	/** One BlankStack with these screens; nested specs become nested stacks. */
	const buildNavigator = (specs: ScreenSpec[], navigatorOptions?: Record<string, unknown>) => {
		const Stack = (navigatorFactory ?? createBlankStackNavigator)() as ReturnType<typeof createBlankStackNavigator>;
		const children = specs.map((spec) => {
			const component = spec.stack
				? (() => {
						const Nested = buildNavigator(spec.stack.screens, spec.stack.screenOptions);
						if (!spec.stack.independent) return () => Nested;
						return ({ route, navigation }: { route: { key: string }; navigation: NavigationLike }) => {
							const outer = React.useContext(OuterNavigation);
							const innerRef = React.useMemo(() => createNavigationContainerRef<Record<string, object | undefined>>(), []);
							React.useLayoutEffect(() => {
								independentRefs.set(route.key, innerRef);
								return () => {
									if (independentRefs.get(route.key) === innerRef) independentRefs.delete(route.key);
								};
							}, [route.key, innerRef]);
							const chain = React.useMemo(() => [navigation, ...outer], [navigation, outer]);
							return React.createElement(
								OuterNavigation.Provider,
								{ value: chain },
								React.createElement(
									NavigationIndependentTree as never,
									null,
									React.createElement(BaseNavigationContainer, { ref: innerRef } as never, Nested),
								),
							);
						};
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
	// Host refs are mock instances naming their view; measure() resolves them against the live tree.
	const createNodeMock = (element: { type: unknown; props: Record<string, unknown> }) => ({
		testID: element.props.testID,
		hostId: element.props.__harnessHostId,
		measureInWindow: () => {},
	});
	(globalThis as { __harnessMeasure?: (instance: unknown) => unknown }).__harnessMeasure = (instance) => {
		const { testID, hostId } = (instance as { testID?: string; hostId?: number } | null) ?? {};
		if ((!testID && !hostId) || !renderer) return null;
		let node: ReactTestInstance | undefined;
		try {
			node = renderer.root.findAll(
				(n) =>
					typeof n.type === "string" &&
					(hostId ? n.props.__harnessHostId === hostId : n.props.testID === testID),
				{ deep: true },
			)[0];
		} catch {
			return null;
		}
		if (!node) return null;
		const box = elementBox(node, sim, { layoutOnly: true });
		return { x: box.x, y: box.y, width: box.width, height: box.height, pageX: box.x, pageY: box.y };
	};
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
			{ createNodeMock } as never,
		);
	});
	const root = renderer as ReactTestRenderer;

	const record = (label?: string) => {
		const frame = {
			frame: sim.clock.frame,
			time: sim.clock.now,
			scenes: readScenes(root, sim),
			overlays: readOverlays(root, sim),
			label,
		};
		trace.push(frame);
		return frame;
	};

	// Scroll views: their offset, and a layout/content-size report once mounted (as React Native sends).
	const scrollOffsets = new Map<string, number>();
	const scrollViews = () => {
		try {
			return root.root.findAll((n) => typeof n.type === "string" && String(n.props.testID ?? "").startsWith(SCROLL_MARKER), { deep: true });
		} catch {
			return [];
		}
	};
	const reportScrollLayouts = () => {
		for (const node of scrollViews()) {
			const id = String(node.props.testID);
			if (scrollOffsets.has(id)) continue;
			scrollOffsets.set(id, 0);
			const spec = scrollSpecOf(id);
			const box = spec && "rect" in spec ? { width: spec.rect.width, height: spec.rect.height } : WINDOW;
			(node.props.onLayout as ((e: unknown) => void) | undefined)?.({ nativeEvent: { layout: { x: 0, y: 0, ...box } } });
			const size = spec?.contentSize ?? box.height;
			(node.props.onContentSizeChange as ((w: number, h: number) => void) | undefined)?.(
				spec?.horizontal ? size : box.width,
				spec?.horizontal ? box.height : size,
			);
		}
	};
	/** The spec of a scroll view by testID: a screen's scroll, or the one nested in it. */
	const scrollSpecOf = (testID: string) => {
		const inner = testID.endsWith(INNER_SCROLL);
		const routeKey = testID.slice(SCROLL_MARKER.length, inner ? -INNER_SCROLL.length : undefined);
		const name = leafRoutes(fullState()).find((r) => r.key === routeKey)?.name;
		const spec = name ? specsByName.get(name)?.scroll : undefined;
		return inner ? spec?.inner : spec;
	};
	scrollOffsetOf = (testID) => scrollOffsets.get(testID) ?? 0;
	teleportHostOf = (portal) => {
		const props = sim.resolveAnimated(portal.props.animatedProps) as { hostName?: unknown } | undefined;
		const hostName = props?.hostName ?? portal.props.hostName;
		if (typeof hostName !== "string" || !hostName || !renderer) return null;
		try {
			return renderer.root.findAll((n) => n.type === TELEPORT_HOST && n.props.name === hostName, { deep: true })[0] ?? null;
		} catch {
			return null;
		}
	};
	/** Sends a scroll event to a scroll view (by testID) and records its offset. */
	const scrollTo = (testID: string, offset: number) => {
		const node = scrollViews().find((n) => n.props.testID === testID);
		if (!node) throw new Error(`no scroll view ${testID}`);
		scrollOffsets.set(testID, offset);
		const horizontal = !!node.props.horizontal;
		const event = { contentOffset: horizontal ? { x: offset, y: 0 } : { x: 0, y: offset } };
		const handlers = ([] as unknown[]).concat(node.props.onScroll ?? []);
		for (const handler of handlers) {
			if (typeof handler === "function") handler(event);
			else (handler as { onScroll?: (e: unknown) => void })?.onScroll?.(event);
		}
	};

	/** One UI frame (after `beforeFrame`, UI-thread work such as touch events), then the JS work it scheduled, then a recorded frame. */
	const frame = async (label?: string, beforeFrame?: () => void) => {
		await act(async () => {
			reportScrollLayouts();
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
		hitTest: (point) => hitTest(root.root, point, sim),
		scrollOffset: (testID) => scrollOffsets.get(testID) ?? 0,
		scrollTo,
		scrollLimit: (testID) => {
			const spec = scrollSpecOf(testID);
			if (!spec) return 0;
			const box = "rect" in spec ? spec.rect : WINDOW;
			return Math.max(0, spec.contentSize - (spec.horizontal ? box.width : box.height));
		},
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
		scrollOffsets,
		/** Scrolls the named screen's scroll view (covered or not) to `offset`, before a frame. */
		scrollScreenTo: async (name: string, offset: number, inner = false) => {
			const key = leafRoutes(fullState()).find((r) => r.name === name)?.key;
			if (!key) throw new Error(`no mounted screen named ${name}`);
			await frame(undefined, () => scrollTo(`${SCROLL_MARKER}${key}${inner ? INNER_SCROLL : ""}`, offset));
		},
		/** Scrolls the focused screen's scroll view (or the one nested in it) to `offset` (on the UI thread, before a frame). */
		scrollFocusedTo: async (offset: number, inner = false) => {
			const key = leafRoutes(fullState()).at(-1)?.key;
			await frame(undefined, () => scrollTo(`${SCROLL_MARKER}${key}${inner ? INNER_SCROLL : ""}`, offset));
		},
		/** The named screen's navigation.setOptions, on the JS thread. */
		setOptions: (name: string, options: object) =>
			js(() => {
				const navigation = navigations[name];
				if (!navigation) throw new Error(`no mounted screen named ${name}`);
				navigation.setOptions(options);
			}),
		renderer: root,
		frame,
		frames,
		settle,
		js,
		record,
		navigate: (name: string, params?: object) => js(() => ref.navigate(name as never, params as never)),
		push: (name: string, params?: object) =>
			js(() => ref.dispatch({ type: "PUSH", payload: { name, params } } as never)),
		/** Back in the innermost focused container that can go back (an independent tree first). */
		goBack: () =>
			js(() => {
				const container = focusedContainers().find((c) => c.canGoBack()) ?? ref;
				container.goBack();
			}),
		/** Pushes `name` onto the nested stack at `path` (route names from the root's routes down). */
		pushIn: (path: string[], name: string, params?: object) =>
			js(() => {
				let state = fullState() as (NavState & { key: string }) | undefined;
				for (const segment of path) {
					const route = state?.routes.find((r) => r.name === segment);
					state = route?.state as (NavState & { key: string }) | undefined;
				}
				if (!state) throw new Error(`no nested stack at ${path.join("/")}`);
				(owners.get(state.key) ?? ref).dispatch({ type: "PUSH", payload: { name, params }, target: state.key } as never);
			}),
		replace: (name: string, params?: object) =>
			js(() => ref.dispatch({ type: "REPLACE", payload: { name, params } } as never)),
		routes: () => ref.getRootState()?.routes.map((r) => ({ key: r.key, name: r.name })) ?? [],
		/** Leaf routes across nested stacks, focused leaf last. */
		leafRoutes: () => leafRoutes(fullState()),
		focusedPath: () => focusedPath(fullState()),
		unmount: () => act(async () => root.unmount()),
		window: WINDOW,
		insets: INSETS,
	};
};

/** An overlay component for screen options: renders a marker naming its owner and the focused route. */
export const HarnessOverlay = ({ route, focusedRoute }: { route: { name: string }; focusedRoute: { name: string } }) => {
	// biome-ignore lint/style/noCommonJs: lazy to keep react out of module init order
	const React = require("react") as typeof import("react");
	return React.createElement("View", { testID: `${OVERLAY_MARKER}${route.name}:${focusedRoute.name}` });
};
