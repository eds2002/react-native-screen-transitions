import { expect, it } from "bun:test";
import { installHarness } from "./install";

const sim = installHarness();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { mountStack } = await import("./stack-harness");
const { interpolate } = await import("react-native-reanimated");

const SPRING = { stiffness: 1000, damping: 500, mass: 3 };
const slide = {
	gestureEnabled: true,
	gestureDirection: "horizontal",
	screenStyleInterpolator: ({ progress, layouts: { screen: { width } } }: any) => {
		"worklet";
		return {
			content: { style: { transform: [{ translateX: interpolate(progress, [0, 1, 2], [width, 0, -width * 0.3]) }] } },
		};
	},
	transitionSpec: { open: SPRING, close: SPRING },
};

const sceneX = (frame: { scenes: Array<{ name: string; rect: { x: number } }> }, name: string) =>
	frame.scenes.find((s) => s.name === name)?.rect.x;

it("pushes and pops with the slide: positions move monotonically and land exactly", async () => {
	const stack = await mountStack(sim, { screens: [{ name: "A" }, { name: "B" }], screenOptions: slide });
	await stack.settle();
	const start = stack.trace.length;
	await stack.navigate("B");
	await stack.settle();
	const push = stack.trace.slice(start);
	const last = push.at(-1)!;
	expect(sceneX(last, "B")).toBeCloseTo(0, 6);
	expect(sceneX(last, "A")).toBeCloseTo(-117, 6);
	// B only moves left, A only moves left, once B is revealed.
	const revealed = push.filter((f) => f.scenes.find((s) => s.name === "B")?.touchable !== undefined);
	for (let i = 1; i < revealed.length; i++) {
		expect(sceneX(revealed[i], "B")!).toBeLessThanOrEqual(sceneX(revealed[i - 1], "B")! + 1e-6);
		expect(sceneX(revealed[i], "A")!).toBeLessThanOrEqual(sceneX(revealed[i - 1], "A")! + 1e-6);
	}
	expect(push.length).toBeGreaterThan(15);

	const popStart = stack.trace.length;
	await stack.goBack();
	await stack.settle();
	const pop = stack.trace.slice(popStart);
	expect(pop.at(-1)!.scenes.map((s) => s.name)).toEqual(["A"]);
	expect(sceneX(pop.at(-1)!, "A")).toBeCloseTo(0, 6);
	console.log(
		"push B.x:", push.map((f) => sceneX(f, "B")?.toFixed(1)).join(" "),
		"\npop B.x:", pop.map((f) => sceneX(f, "B")?.toFixed(1)).join(" "),
	);
	await stack.unmount();
});
