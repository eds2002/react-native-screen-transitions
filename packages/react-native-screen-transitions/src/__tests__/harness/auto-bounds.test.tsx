import { expect, it } from "bun:test";
import { installHarness } from "./install";

const sim = installHarness();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { mountStack } = await import("./stack-harness");
const { Dimensions } = await import("react-native");

const SPRING = { stiffness: 1000, damping: 500, mass: 3 };
const { width: W, height: H } = Dimensions.get("window");
const card = { x: W * 0.1, y: H * 0.6, width: W * 0.36, height: H * 0.2 };
const target = { x: W * 0.05, y: H * 0.12, width: W * 0.9, height: H * 0.35 };

type Rect = { x: number; y: number; width: number; height: number };
type Frame = { scenes: Array<{ name: string; rect: Rect; elements: Record<string, { rect: Rect }> }> };

/** Opens B from A's card and closes it again: B's boundary rect and B's own rect, frame by frame. */
const openAndClose = async (options: Record<string, unknown>, bound: Record<string, unknown> = {}) => {
	const stack = await mountStack(sim, {
		screens: [
			{ name: "A", bounds: [{ id: "card", rect: card, pushTo: "B" }] },
			{
				name: "B",
				options: { transitionSpec: { open: SPRING, close: SPRING }, ...options },
				bounds: [{ id: "card", rect: target, ...bound }],
			},
		],
	});
	await stack.settle();
	const track = (frames: Frame[]) =>
		frames.map((frame) => {
			const scene = frame.scenes.find((s) => s.name === "B");
			return scene ? { card: scene.elements["bound:card"]?.rect ?? null, screen: scene.rect } : null;
		});
	const openStart = stack.trace.length;
	await stack.tap({ x: card.x + card.width / 2, y: card.y + card.height / 2 });
	await stack.settle();
	const open = track(stack.trace.slice(openStart) as Frame[]);
	const closeStart = stack.trace.length;
	await stack.goBack();
	await stack.settle();
	const close = track(stack.trace.slice(closeStart) as Frame[]);
	await stack.unmount();
	return { open, close };
};

/** Frames where B is on screen (before it is ready, the library holds it far off screen). */
const shown = <T extends { screen: Rect } | null>(frames: T[]) =>
	frames.filter((f): f is NonNullable<T> => !!f && f.screen.x < W && f.screen.y < H);

/** Equal up to float rounding, frame by frame. */
const sameTrack = (a: unknown, b: unknown): boolean => {
	if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 1e-6;
	if (a && b && typeof a === "object" && typeof b === "object") {
		const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
		for (const key of keys) {
			if (!sameTrack((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
		}
		return true;
	}
	return a === b;
};

const near = (a: Rect, b: Rect, tolerance: number) =>
	Math.abs(a.x - b.x) <= tolerance &&
	Math.abs(a.y - b.y) <= tolerance &&
	Math.abs(a.width - b.width) <= tolerance &&
	Math.abs(a.height - b.height) <= tolerance;

it("a matching boundary flies on its own, exactly as bounds(id).styles() moves it", async () => {
	const explicit = await openAndClose({
		screenStyleInterpolator: ({ bounds }: any) => {
			"worklet";
			return { card: bounds("card").styles() };
		},
	});
	const auto = await openAndClose({});
	expect(auto.open.length).toBe(explicit.open.length);
	expect(sameTrack(auto, explicit)).toBe(true);

	// It flew: out of A's card, onto B's own rect, and back.
	const cards = shown(auto.open).map((f) => f.card).filter((r): r is Rect => !!r);
	expect(near(cards[0], card, 40)).toBe(true);
	expect(near(cards.at(-1)!, target, 1)).toBe(true);
	const closing = shown(auto.close).map((f) => f.card).filter((r): r is Rect => !!r);
	expect(closing.some((r) => near(r, card, 40))).toBe(true);
});

it("the screen itself doesn't move without an interpolator, only its boundary does", async () => {
	const { open } = await openAndClose({});
	const screens = shown(open).map((f) => f.screen);
	expect(screens.length).toBeGreaterThan(5);
	for (const screen of screens) {
		expect(screen.x).toBeCloseTo(0, 6);
		expect(screen.y).toBeCloseTo(0, 6);
	}
});

it("a boundary with animate={false} stays where it is", async () => {
	const { open } = await openAndClose({}, { animate: false });
	const cards = shown(open).map((f) => f.card).filter((r): r is Rect => !!r);
	expect(cards.length).toBeGreaterThan(5);
	for (const rect of cards) expect(near(rect, target, 0.5)).toBe(true);
});
