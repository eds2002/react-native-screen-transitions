import { expect, it } from "bun:test";
import { installHarness, TELEPORT_HOST, TELEPORT_PORTAL, WINDOW } from "./install";

// The teleport stand-in: a boundary that escapes clipping really moves into its overlay host, and the
// recorder places it there (its rect composes the host's ancestors), so the catalog's teleport run
// tests the path apps with react-native-teleport take.
const sim = installHarness({ teleport: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { mountStack } = await import("./stack-harness");
const specs = await import("../../configs/specs");

const card = { x: WINDOW.width * 0.1, y: WINDOW.height * 0.24, width: WINDOW.width * 0.36, height: WINDOW.height * 0.21 };
const zoom = {
	gestureEnabled: true,
	transitionSpec: { open: specs.Zoom, close: specs.Zoom },
	screenStyleInterpolator: ({ bounds }: any) => {
		"worklet";
		return bounds("card").navigation.zoom();
	},
};

it("escapes the opening card into its screen's overlay host and places it on its slot", async () => {
	const stack = await mountStack(sim, {
		screens: [{ name: "A", bounds: [{ id: "card", rect: card, pushTo: "Z" }] }, { name: "Z", options: zoom }],
	});
	await stack.settle();
	const escapedHost = () => {
		const portal = stack.renderer.root
			.findAll((n) => n.type === TELEPORT_PORTAL, { deep: true })
			.find((n) => {
				const props = sim.resolveAnimated(n.props.animatedProps) as { hostName?: string } | undefined;
				return typeof props?.hostName === "string" && props.hostName.length > 0;
			});
		if (!portal) return null;
		const { hostName } = sim.resolveAnimated(portal.props.animatedProps) as { hostName: string };
		return stack.renderer.root.findAll((n) => n.type === TELEPORT_HOST && n.props.name === hostName, { deep: true })[0] ?? null;
	};
	// At rest nothing escapes.
	expect(escapedHost()).toBeNull();

	await stack.tap({ x: card.x + card.width / 2, y: card.y + card.height / 2 });
	const cardRect = () => stack.trace.at(-1)?.scenes.find((s) => s.name === "A")?.elements["bound:card"]?.rect;
	const ys: number[] = [cardRect()?.y ?? 0];
	let firstEscaped = -1;
	let escapedFrames = 0;
	for (let i = 0; i < 40; i++) {
		await stack.frame();
		ys.push(cardRect()?.y ?? 0);
		if (!escapedHost()) continue;
		escapedFrames++;
		if (firstEscaped < 0) firstEscaped = ys.length - 1;
	}
	// The card grows out of its slot on a spring: moving into the host continues that motion (the frame
	// it escapes lies between its neighbours), it does not jump.
	expect(firstEscaped).toBeGreaterThan(0);
	const [before, at, after] = [ys[firstEscaped - 1], ys[firstEscaped], ys[firstEscaped + 1]];
	expect(at).toBeLessThanOrEqual(before);
	expect(after).toBeLessThanOrEqual(at);
	expect(escapedFrames).toBeGreaterThan(5);
	await stack.settle();
	// It stays in the host while its pair is open, and returns inline once the close settles.
	expect(escapedHost()).not.toBeNull();
	await stack.goBack();
	await stack.settle();
	expect(escapedHost()).toBeNull();
	const rest = cardRect();
	expect(rest?.x).toBeCloseTo(card.x, 3);
	expect(rest?.y).toBeCloseTo(card.y, 3);
	await stack.unmount();
});
