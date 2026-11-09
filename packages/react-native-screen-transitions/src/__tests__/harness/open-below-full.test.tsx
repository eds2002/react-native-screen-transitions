import { expect, it } from "bun:test";
import { installHarness } from "./install";

const sim = installHarness();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { mountStack } = await import("./stack-harness");

const SPRING = { stiffness: 1000, damping: 500, mass: 3 };
const slide = {
	gestureEnabled: true,
	gestureDirection: "vertical",
	screenStyleInterpolator: ({ progress, layouts: { screen: { height } } }: any) => {
		"worklet";
		return { content: { style: { transform: [{ translateY: (1 - Math.min(progress, 1)) * height }] } } };
	},
	transitionSpec: { open: SPRING, close: SPRING },
};

const names = (frame: { scenes: Array<{ name: string }> }) => frame.scenes.map((s) => s.name);

// A replaced screen stays under its replacement until the replacement has opened. A sheet that
// opens to a snap point below 1 has opened when it settles there, so the replaced screen goes.
it.each([
	{ name: "a sheet opening to 0.5", options: { snapPoints: [0.5] } },
	{ name: "a screen opening fully", options: {} },
])("replacing with $name removes the replaced screen once it has opened", async ({ options }) => {
	const stack = await mountStack(sim, {
		screens: [{ name: "A" }, { name: "B" }, { name: "C", options }],
		screenOptions: slide,
	});
	await stack.settle();
	await stack.navigate("B");
	await stack.settle();
	await stack.replace("C");
	await stack.settle();
	expect(names(stack.trace.at(-1)!)).toEqual(["A", "C"]);
	await stack.unmount();
});
